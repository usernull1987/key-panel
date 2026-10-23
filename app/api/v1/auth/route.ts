// app/api/v1/auth/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashKey } from '@/lib/keys'
import { secureApiRequest } from '@/lib/api-middleware'
import { createApiSession, logApiRequest } from '@/lib/api-security'

export async function POST(req: Request) {
  const startTime = Date.now()

  // ═══ ตรวจความปลอดภัย ═══
  const sec = await secureApiRequest(req, { endpoint: '/api/v1/auth' })
  if (!sec.ok) return sec.response

  const { body, credential, ip } = sec

  try {
    const { license_key, hwid } = body

    if (!license_key || !hwid) {
      await logApiRequest({
        endpoint: '/api/v1/auth',
        apiCredentialId: credential.id,
        ip,
        success: false,
        reason: 'MISSING_PARAMS',
        latencyMs: Date.now() - startTime,
      })
      return NextResponse.json(
        { valid: false, reason: 'MISSING_PARAMS' },
        { status: 400 }
      )
    }

    // ═══ ตรวจ License Key + HWID ═══
    const keyHash = hashKey(license_key)
    const { data, error } = await supabaseAdmin.rpc('verify_license_key', {
      p_key_hash: keyHash,
      p_hwid: hwid,
      p_ip: ip,
      p_user_agent: req.headers.get('user-agent'),
    })

    if (error) {
      return NextResponse.json(
        { valid: false, reason: 'SERVER_ERROR' },
        { status: 500 }
      )
    }

    if (!data?.valid) {
      await logApiRequest({
        endpoint: '/api/v1/auth',
        apiCredentialId: credential.id,
        ip,
        hwid,
        success: false,
        reason: data?.reason || 'INVALID',
        latencyMs: Date.now() - startTime,
      })
      return NextResponse.json(data, { status: 401 })
    }

    // ═══ สร้าง Session ═══
    const session = await createApiSession({
      licenseKeyId: data.key_id,
      hwid,
      ip,
    })

    await logApiRequest({
      endpoint: '/api/v1/auth',
      apiCredentialId: credential.id,
      licenseKeyId: data.key_id,
      hwid,
      ip,
      success: true,
      reason: 'OK',
      latencyMs: Date.now() - startTime,
    })

    return NextResponse.json({
      valid: true,
      session_token: session.token,
      session_expires_at: session.expiresAt.toISOString(),
      category: data.category,
      duration_value: data.duration_value,
      duration_unit: data.duration_unit,
      first_used_at: data.first_used_at,
      expires_at: data.expires_at,
    })
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, reason: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}