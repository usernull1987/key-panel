// app/api/v1/verify/route.ts
import { NextResponse } from 'next/server'
import { secureApiRequest } from '@/lib/api-middleware'
import { validateSession, logApiRequest } from '@/lib/api-security'

export async function POST(req: Request) {
  const startTime = Date.now()

  // ═══ ตรวจความปลอดภัย ═══
  const sec = await secureApiRequest(req, { endpoint: '/api/v1/verify' })
  if (!sec.ok) return sec.response

  const { body, credential, ip } = sec

  try {
    const { session_token, hwid } = body

    if (!session_token || !hwid) {
      return NextResponse.json(
        { valid: false, reason: 'MISSING_PARAMS' },
        { status: 400 }
      )
    }

    // ═══ ตรวจ Session ═══
    const result = await validateSession(session_token, hwid)

    await logApiRequest({
      endpoint: '/api/v1/verify',
      apiCredentialId: credential.id,
      licenseKeyId: result.session?.license_key_id,
      hwid,
      ip,
      success: result.valid,
      reason: result.valid ? 'OK' : result.reason,
      latencyMs: Date.now() - startTime,
    })

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, reason: result.reason },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      session_expires_at: result.session!.expires_at,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, reason: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}