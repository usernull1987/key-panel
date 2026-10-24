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
    } else if (filter === 'test') {
      query = query.eq('is_test', true)
    }

    const { data: keys, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json({ message: fetchError.message }, { status: 500 })
    }

    const count = keys?.length ?? 0
    if (count === 0) {
      return NextResponse.json({ success: true, deleted: 0, message: 'ไม่มี Key ที่จะลบ' })
    }

    const ids = keys!.map((k) => k.id)

    const { error: deleteError } = await supabaseAdmin
      .from('LicenseKey')
      .delete()
      .in('id', ids)

    if (deleteError) {
      return NextResponse.json({ message: deleteError.message }, { status: 500 })
    }

    const filterLabel =
      filter === 'expired' ? 'หมดอายุ' :
      filter === 'revoked' ? 'ถูกระงับ' :
      filter === 'pending' ? 'รอใช้' :
      filter === 'test' ? 'Test Keys' : 'ทั้งหมด'

    await notify({
      title: '[BULK DELETE] ลบคีย์',
      message: `ลบ ${count} คีย์ (${filterLabel})\nโดย: ${session.username}`,
      type: 'info',
    })

    return NextResponse.json({
      success: true,
      deleted: count,
      message: `ลบ ${count} คีย์สำเร็จ`,
    })
  } catch (err: any) {
    console.error('BULK DELETE ERROR:', err)
    return NextResponse.json({ message: err?.message || 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}