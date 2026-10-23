import { NextResponse } from 'next/server'
import {
  checkAndStoreNonce,
  checkRateLimit,
  computeSignature,
  hashSecret,
  isIpAllowed,
  logApiRequest,
  validateApiCredential,
  validateTimestamp,
} from '@/lib/api-security'

interface SecureRequestOptions {
  endpoint: string
}

/**
 * ตรวจสอบความปลอดภัยของ request ที่มาจากโปรแกรม
 * คืน { ok: true, credential, body, ip } หรือ { ok: false, response }
 */
export async function secureApiRequest(
  req: Request,
  options: SecureRequestOptions
): Promise<
  | { ok: true; credential: any; body: any; ip: string | null }
  | { ok: false; response: NextResponse }
> {
  const startTime = Date.now()
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null
  const userAgent = req.headers.get('user-agent')

  try {
    // ═══ 1) อ่าน headers ═══
    const apiKey = req.headers.get('x-api-key') || ''
    const timestampStr = req.headers.get('x-timestamp') || ''
    const signature = req.headers.get('x-signature') || ''
    const nonce = req.headers.get('x-nonce') || ''

    if (!apiKey || !timestampStr || !signature || !nonce) {
      await logApiRequest({
        endpoint: options.endpoint,
        ip,
        userAgent,
        success: false,
        reason: 'MISSING_HEADERS',
        latencyMs: Date.now() - startTime,
      })
      return {
        ok: false,
        response: NextResponse.json(
          { valid: false, reason: 'MISSING_HEADERS' },
          { status: 400 }
        ),
      }
    }

    // ═══ 2) ตรวจ API Key ═══
    const validation = await validateApiCredential(apiKey)
    if (!validation.valid) {
      await logApiRequest({
        endpoint: options.endpoint,
        ip,
        userAgent,
        success: false,
        reason: validation.reason,
        latencyMs: Date.now() - startTime,
      })
      return {
        ok: false,
        response: NextResponse.json(
          { valid: false, reason: validation.reason },
          { status: 401 }
        ),
      }
    }

    const credential = validation.credential!

    // ═══ 3) ตรวจ IP Allowlist ═══
    if (!isIpAllowed(ip, credential.allowed_ips)) {
      await logApiRequest({
        endpoint: options.endpoint,
        apiCredentialId: credential.id,
        ip,
        userAgent,
        success: false,
        reason: 'IP_NOT_ALLOWED',
        latencyMs: Date.now() - startTime,
      })
      return {
        ok: false,
        response: NextResponse.json(
          { valid: false, reason: 'IP_NOT_ALLOWED' },
          { status: 403 }
        ),
      }
    }

    // ═══ 4) Rate Limit ═══
    const rate = await checkRateLimit(
      'apikey:' + credential.id,
      credential.rate_limit_per_min
    )
    if (!rate.allowed) {
      await logApiRequest({
        endpoint: options.endpoint,
        apiCredentialId: credential.id,
        ip,
        userAgent,
        success: false,
        reason: 'RATE_LIMIT_EXCEEDED',
        latencyMs: Date.now() - startTime,
      })
      return {
        ok: false,
        response: NextResponse.json(
          { valid: false, reason: 'RATE_LIMIT_EXCEEDED', resetAt: rate.resetAt },
          {
            status: 429,
            headers: {
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.floor(rate.resetAt.getTime() / 1000).toString(),
            },
          }
        ),
      }
    }

    // ═══ 5) ตรวจ Timestamp ═══
    const timestamp = parseInt(timestampStr)
    if (!validateTimestamp(timestamp)) {
      await logApiRequest({
        endpoint: options.endpoint,
        apiCredentialId: credential.id,
        ip,
        userAgent,
        success: false,
        reason: 'TIMESTAMP_INVALID',
        latencyMs: Date.now() - startTime,
      })
      return {
        ok: false,
        response: NextResponse.json(
          { valid: false, reason: 'TIMESTAMP_INVALID' },
          { status: 401 }
        ),
      }
    }

    // ═══ 6) อ่าน body + ตรวจ Signature ═══
    const bodyText = await req.text()
    const path = new URL(req.url).pathname

    // ⭐ Signature = HMAC(secret, `${timestamp}.${path}.${body}`)
    // แต่เราเก็บแค่ hash ของ secret — ต้องรับ secret มาจาก client
    // ❌ ปัญหา: ไม่สามารถ verify HMAC ด้วย hash ได้
    // ✅ วิธีแก้: เก็บ secret encrypted (AES) หรือใช้ bcrypt ไม่ได้
    // ⚠️ วิธีที่ปลอดภัยกว่า: Client ส่ง api_key + secret มา → server hash secret แล้วเทียบ
    // แต่การส่ง secret ทุกครั้งไม่ปลอดภัยพอ
    // 
    // ✅ วิธีที่ดีที่สุด: ใช้ api_key เป็น HMAC key โดยตรง
    //    - api_key เก็บ plaintext (ต้องใช้ verify)
    //    - signature = HMAC(api_key, payload)
    //    - ป้องกัน replay ด้วย timestamp + nonce
    const expectedSignature = computeSignature(apiKey, {
      body: bodyText,
      timestamp,
      path,
    })

    if (signature !== expectedSignature) {
      await logApiRequest({
        endpoint: options.endpoint,
        apiCredentialId: credential.id,
        ip,
        userAgent,
        success: false,
        reason: 'SIGNATURE_INVALID',
        latencyMs: Date.now() - startTime,
      })
      return {
        ok: false,
        response: NextResponse.json(
          { valid: false, reason: 'SIGNATURE_INVALID' },
          { status: 401 }
        )
      }
    }

    // ═══ 7) ตรวจ Nonce (replay) ═══
    const nonceOk = await checkAndStoreNonce(nonce, credential.id)
    if (!nonceOk) {
      await logApiRequest({
        endpoint: options.endpoint,
        apiCredentialId: credential.id,
        ip,
        userAgent,
        success: false,
        reason: 'NONCE_REPLAY',
        latencyMs: Date.now() - startTime,
      })
      return {
        ok: false,
        response: NextResponse.json(
          { valid: false, reason: 'NONCE_REPLAY' },
          { status: 401 }
        ),
      }
    }

    // ═══ 8) อัปเดต last_used_at ═══
    await supabaseAdminUpdateLastUsed(credential.id)

    return {
      ok: true,
      credential,
      body: bodyText ? JSON.parse(bodyText) : {},
      ip,
    }
  } catch (err: any) {
    await logApiRequest({
      endpoint: options.endpoint,
      ip,
      userAgent,
      success: false,
      reason: 'SERVER_ERROR',
      latencyMs: Date.now() - startTime,
    })
    return {
      ok: false,
      response: NextResponse.json(
        { valid: false, reason: 'SERVER_ERROR' },
        { status: 500 }
      ),
    }
  }
}

// helper
async function supabaseAdminUpdateLastUsed(id: string) {
  const { supabaseAdmin } = await import('@/lib/supabase')
  await supabaseAdmin
    .from('ApiCredential')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', id)
}