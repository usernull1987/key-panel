import { NextResponse } from 'next/server'
import {
  checkAndStoreNonce,
  checkRateLimit,
  computeSignature,
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

  // ═══════════════════════════════════════════
  // DEBUG LOG
  // ═══════════════════════════════════════════
  console.log('\n[MW] ═══════════════════════════════════════')
  console.log('[MW] Endpoint:', options.endpoint)
  console.log('[MW] IP:', ip || 'unknown')
  console.log('[MW] User-Agent:', userAgent?.substring(0, 60) || 'unknown')

  try {
    // ═══════════════════════════════════════════
    // 1) อ่าน headers
    // ═══════════════════════════════════════════
    const apiKey = req.headers.get('x-api-key') || ''
    const timestampStr = req.headers.get('x-timestamp') || ''
    const signature = req.headers.get('x-signature') || ''
    const nonce = req.headers.get('x-nonce') || ''

    console.log('[MW] Headers:', {
      apiKey: apiKey ? apiKey.substring(0, 20) + '...' : 'MISSING',
      apiKeyLen: apiKey.length,
      timestamp: timestampStr || 'MISSING',
      signature: signature ? signature.substring(0, 16) + '...' : 'MISSING',
      signatureLen: signature.length,
      nonce: nonce ? nonce.substring(0, 16) + '...' : 'MISSING',
    })

    if (!apiKey || !timestampStr || !signature || !nonce) {
      console.log('[MW] ❌ FAIL: MISSING_HEADERS', {
        hasApiKey: !!apiKey,
        hasTimestamp: !!timestampStr,
        hasSignature: !!signature,
        hasNonce: !!nonce,
      })

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

    // ═══════════════════════════════════════════
    // 2) ตรวจ API Key
    // ═══════════════════════════════════════════
    const validation = await validateApiCredential(apiKey)

    console.log('[MW] Validation:', {
      valid: validation.valid,
      reason: (validation as any).reason || '-',
      credentialName: (validation as any).credential?.name || '-',
    })

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

    // ═══════════════════════════════════════════
    // 3) IP Allowlist
    // ═══════════════════════════════════════════
    const ipAllowed = isIpAllowed(ip, credential.allowed_ips)

    console.log('[MW] IP Check:', {
      ip,
      allowedIps: credential.allowed_ips,
      allowed: ipAllowed,
    })

    if (!ipAllowed) {
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

    // ═══════════════════════════════════════════
    // 4) Rate Limit
    // ═══════════════════════════════════════════
    const rate = await checkRateLimit(
      'apikey:' + credential.id,
      credential.rate_limit_per_min
    )

    console.log('[MW] Rate Limit:', {
      allowed: rate.allowed,
      remaining: rate.remaining,
      limit: credential.rate_limit_per_min,
    })

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

    // ═══════════════════════════════════════════
    // 5) Timestamp
    // ═══════════════════════════════════════════
    const timestamp = parseInt(timestampStr)
    const tsValid = validateTimestamp(timestamp)

    console.log('[MW] Timestamp Check:', {
      timestamp,
      now: Date.now(),
      diff: Date.now() - timestamp,
      valid: tsValid,
    })

    if (!tsValid) {
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

    // ═══════════════════════════════════════════
    // 6) Signature
    // ═══════════════════════════════════════════
    const bodyText = await req.text()
    const path = new URL(req.url).pathname

    console.log('[MW] Signature Data:', {
      path,
      bodyLength: bodyText.length,
      bodyPreview: bodyText.substring(0, 100),
    })

    const expectedSignature = computeSignature(apiKey, {
      body: bodyText,
      timestamp,
      path,
    })

    const sigValid = signature === expectedSignature

    console.log('[MW] Signature Check:', {
      received: signature.substring(0, 32),
      expected: expectedSignature.substring(0, 32),
      valid: sigValid,
    })

    if (!sigValid) {
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
        ),
      }
    }

    // ═══════════════════════════════════════════
    // 7) Nonce (Anti-Replay)
    // ═══════════════════════════════════════════
    const nonceOk = await checkAndStoreNonce(nonce, credential.id)

    console.log('[MW] Nonce Check:', { valid: nonceOk })

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

    // ═══════════════════════════════════════════
    // 8) อัปเดต last_used_at
    // ═══════════════════════════════════════════
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      await supabaseAdmin
        .from('ApiCredential')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', credential.id)
    } catch (err) {
      console.error('[MW] Failed to update last_used_at:', err)
    }

    // ═══════════════════════════════════════════
    // ✅ SUCCESS
    // ═══════════════════════════════════════════
    console.log('[MW] ✅ SUCCESS')
    console.log('[MW] ═══════════════════════════════════════\n')

    return {
      ok: true,
      credential,
      body: bodyText ? JSON.parse(bodyText) : {},
      ip,
    }
  } catch (err: any) {
    console.error('[MW] ❌ EXCEPTION:', err)
    console.error('[MW] Stack:', err?.stack)
    console.log('[MW] ═══════════════════════════════════════\n')

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
        { valid: false, reason: 'SERVER_ERROR', error: err?.message },
        { status: 500 }
      ),
    }
  }
}