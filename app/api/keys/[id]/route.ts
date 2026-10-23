import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { notify } from '@/lib/notify'

// GET — ดึงข้อมูล key + hwids
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  if (session.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const { data: key, error: keyError } = await supabaseAdmin
    .from('LicenseKey')
    .select(
      'id, key_code, category, prefix, duration_value, duration_unit, max_hwid, note, is_active, is_test, first_used_at, expires_at, created_at, updated_at'
    )
    .eq('id', id)
    .maybeSingle()

  if (keyError) return NextResponse.json({ message: keyError.message }, { status: 500 })
  if (!key) return NextResponse.json({ message: 'ไม่พบ Key' }, { status: 404 })

  const { data: hwids } = await supabaseAdmin
    .from('KeyHwid')
    .select('id, hwid, ip_address, user_agent, first_seen_at, last_seen_at')
    .eq('license_key_id', id)
    .order('first_seen_at', { ascending: false })

  return NextResponse.json({
    data: {
      key,
      hwids: hwids || [],
    },
  })
}

// PATCH — update / extend
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  if (session.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  if (body.action === 'extend') {
    const { extend_value, extend_unit } = body
    if (!extend_value || !extend_unit) {
      return NextResponse.json({ message: 'ต้องระบุค่าและหน่วย' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.rpc('extend_license', {
      p_key_id: id,
      p_extend_value: extend_value,
      p_extend_unit: extend_unit,
    })

    if (error) return NextResponse.json({ message: error.message }, { status: 500 })
    if (!data?.success) return NextResponse.json({ message: data?.message || 'Extend failed' }, { status: 400 })

    await notify({
      title: '[EXTEND] เพิ่มเวลา Key',
      message: `เพิ่ม ${extend_value} ${extend_unit} ให้ key ID ${id.slice(0, 8)}...`,
      type: 'info',
    })

    return NextResponse.json(data)
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if ('is_active' in body) updates.is_active = body.is_active
  if ('note' in body) updates.note = body.note
  if ('max_hwid' in body) updates.max_hwid = body.max_hwid

  const { error } = await supabaseAdmin
    .from('LicenseKey')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  if (body.is_active === false) {
    await notify({
      title: '[REVOKE] ระงับ Key',
      message: `Admin ระงับ key ${id.slice(0, 8)}...`,
      type: 'info',
    })
  }

  return NextResponse.json({ success: true })
}

// DELETE
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  if (session.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { error } = await supabaseAdmin.from('LicenseKey').delete().eq('id', id)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}