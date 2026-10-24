import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { notify } from '@/lib/notify'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const { filter = 'all' } = body

    let query = supabaseAdmin.from('LicenseKey').select('id', { count: 'exact' })

    if (filter === 'expired') {
      query = query.not('expires_at', 'is', null).lt('expires_at', new Date().toISOString())
    } else if (filter === 'revoked') {
      query = query.eq('is_active', false)
    } else if (filter === 'pending') {
      query = query.eq('is_active', true).is('first_used_at', null)
    }

    const { data: keys, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json({ message: fetchError.message }, { status: 500 })
    }

    const count = keys?.length ?? 0
    if (count === 0) {
      return NextResponse.json({ success: true, updated: 0, message: 'ไม่มี Key ที่จะเปิดใช้งาน' })
    }

    const ids = keys!.map((k) => k.id)

    const { error: updateError } = await supabaseAdmin
      .from('LicenseKey')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .in('id', ids)

    if (updateError) {
      return NextResponse.json({ message: updateError.message }, { status: 500 })
    }

    const filterLabel =
      filter === 'revoked' ? 'ถูกระงับ' :
      filter === 'expired' ? 'หมดอายุ' : 'ทั้งหมด'

    await notify({
      title: '[BULK ACTIVATE] เปิดใช้งานคีย์',
      message: `เปิดใช้งาน ${count} คีย์ (${filterLabel})\nโดย: ${session.username}`,
      type: 'success',
    })

    return NextResponse.json({
      success: true,
      updated: count,
      message: `เปิดใช้งาน ${count} คีย์สำเร็จ`,
    })
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}