import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { hashSecret } from '@/lib/api-security'
import { notify } from '@/lib/notify'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('ApiCredential')
    .select(
      'id, name, api_key, is_active, rate_limit_per_min, allowed_ips, expires_at, last_used_at, created_at'
    )
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      name,
      rate_limit_per_min = 60,
      allowed_ips = null,
      expires_at = null,
      notify_telegram = true,
    } = body

    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { message: 'ชื่อต้องมีอย่างน้อย 3 ตัวอักษร' },
        { status: 400 }
      )
    }

    const apiKey = 'sk_live_' + crypto.randomBytes(32).toString('hex')
    const apiKeyHash = hashSecret(apiKey)

    const { data, error } = await supabaseAdmin
      .from('ApiCredential')
      .insert({
        name: name.trim(),
        api_key: apiKey,
        api_secret_hash: apiKeyHash,
        rate_limit_per_min,
        allowed_ips,
        expires_at,
        created_by: session.userId,
      })
      .select(
        'id, name, api_key, rate_limit_per_min, allowed_ips, expires_at, created_at'
      )
      .single()

    if (error) return NextResponse.json({ message: error.message }, { status: 500 })

    if (notify_telegram) {
      await notify({
        title: '[CREATE] API Client',
        message:
          'ชื่อ: ' +
          name.trim() +
          '\nRate: ' +
          rate_limit_per_min +
          '/min' +
          (allowed_ips && allowed_ips.length ? '\nIP: ' + allowed_ips.join(', ') : '\nIP: ทุก IP'),
        type: 'success',
      })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err?.message }, { status: 500 })
  }
}