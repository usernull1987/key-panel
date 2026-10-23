import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { notify } from '@/lib/notify'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const { data: existing } = await supabaseAdmin
    .from('ApiCredential')
    .select('name, is_active')
    .eq('id', id)
    .maybeSingle()

  if (!existing) return NextResponse.json({ message: 'ไม่พบ API Key' }, { status: 404 })

  const updates: Record<string, any> = {}
  if ('is_active' in body) updates.is_active = body.is_active
  if ('name' in body) updates.name = body.name
  if ('rate_limit_per_min' in body) updates.rate_limit_per_min = body.rate_limit_per_min
  if ('allowed_ips' in body) updates.allowed_ips = body.allowed_ips
  if ('expires_at' in body) updates.expires_at = body.expires_at

  const { error } = await supabaseAdmin
    .from('ApiCredential')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  if ('is_active' in body && existing.is_active !== body.is_active) {
    await notify({
      title: body.is_active ? '[ACTIVATE] API Key' : '[REVOKE] API Key',
      message: 'ชื่อ: ' + existing.name,
      type: body.is_active ? 'success' : 'info',
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: existing } = await supabaseAdmin
    .from('ApiCredential')
    .select('name')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabaseAdmin.from('ApiCredential').delete().eq('id', id)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  if (existing) {
    await notify({
      title: '[DELETE] API Key',
      message: 'ชื่อ: ' + existing.name,
      type: 'info',
    })
  }

  return NextResponse.json({ success: true })
}