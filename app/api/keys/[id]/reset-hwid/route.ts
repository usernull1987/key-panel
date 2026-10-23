import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { notify } from '@/lib/notify'

/**
 * POST /api/keys/[id]/reset-hwid
 * Body: { hwid?: string }   // ไม่ส่ง = reset ทั้งหมด
 * Admin only
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // Admin only
  if (session.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await req.json().catch(() => ({}))
    const targetHwid = body.hwid?.trim() || null

    // ตรวจ key มีอยู่จริง
    const { data: key, error: keyError } = await supabaseAdmin
      .from('LicenseKey')
      .select('id, key_code, category')
      .eq('id', id)
      .maybeSingle()

    if (keyError || !key) {
      return NextResponse.json({ message: 'ไม่พบ License Key' }, { status: 404 })
    }

    // เรียก SQL function (atomic)
    const { data, error } = await supabaseAdmin.rpc('reset_license_hwid', {
      p_key_id: id,
      p_hwid: targetHwid,
      p_admin_id: session.userId,
    })

    if (error) {
      console.error('RESET HWID ERROR:', error)
      return NextResponse.json(
        { message: error.message || 'ไม่สามารถ reset HWID ได้' },
        { status: 500 }
      )
    }

    if (!data?.success) {
      return NextResponse.json(
        { message: data?.message || 'Reset ไม่สำเร็จ' },
        { status: 400 }
      )
    }

    // แจ้งเตือน Telegram
    await notify({
      title: '[RESET] Admin Reset HWID',
      message:
        'Key: ' + key.key_code + '\n' +
        (targetHwid
          ? 'HWID: ' + targetHwid.slice(0, 16) + '...\n'
          : 'ลบทั้งหมด ' + data.deleted + ' HWID\n') +
        'โดย: ' + session.username,
      type: 'info',
    })

    return NextResponse.json({
      success: true,
      deleted: data.deleted,
      message: data.message,
    })
  } catch (err: any) {
    console.error('RESET HWID CATCH:', err)
    return NextResponse.json(
      { message: err?.message || 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}