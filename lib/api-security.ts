import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════
const MAX_CLOCK_SKEW_MS = 60_000 // 60 วินาที
const NONCE_TTL_MS = 5 * 60_000 // 5 นาที
const SESSION_TTL_MS = 60 * 60_000 // 1 ชั่วโมง

// ═══════════════════════════════════════════
// HMAC Signature
// ═══════════════════════════════════════════
export function computeSignature(
  secret: string,
  payload: { body: string; timestamp: number; path: string }
): string {
  const data = `${payload.timestamp}.${payload.path}.${payload.body}`
  return crypto.createHmac('sha256', secret).update(data).digest('hex')
}

export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex')
}

// ═══════════════════════════════════════════
// Rate Limit (per identifier — ip/apikey)
// ═══════════════════════════════════════════
export async function checkRateLimit(
  identifier: string,
  limitPerMin: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date()
  const windowStart = new Date(
    Math.floor(now.getTime() / 60_000) * 60_000
  )

  // increment หรือ insert
  const { data: existing } = await supabaseAdmin
    .from('RateLimit')
    .select('count')
    .eq('identifier', identifier)
    .eq('window_start', windowStart.toISOString())
    .maybeSingle()

  if (!existing) {
    await supabaseAdmin.from('RateLimit').insert({
      identifier,
      window_start: windowStart.toISOString(),
      count: 1,
    })
    return {
      allowed: true,
      remaining: limitPerMin - 1,
      resetAt: new Date(windowStart.getTime() + 60_000),
    }
  }

  if (existing.count >= limitPerMin) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(windowStart.getTime() + 60_000),
    }
  }

  await supabaseAdmin
    .from('RateLimit')
    .update({ count: existing.count + 1 })
    .eq('identifier', identifier)
    .eq('window_start', windowStart.toISOString())

  return {
    allowed: true,
    remaining: limitPerMin - existing.count - 1,
    resetAt: new Date(windowStart.getTime() + 60_000),
  }
}

// ═══════════════════════════════════════════
// Nonce (กัน replay)
// ═══════════════════════════════════════════
export async function checkAndStoreNonce(
  nonce: string,
  apiCredentialId: string
): Promise<boolean> {
  if (!nonce || nonce.length < 16) return false

  try {
    await supabaseAdmin.from('ApiNonce').insert({
      nonce,
      api_credential_id: apiCredentialId,
    })
    return true
  } catch {
    // unique violation = replay attack
    return false
  }
}

// ═══════════════════════════════════════════
// Validate API Credential
// ═══════════════════════════════════════════
export async function validateApiCredential(apiKey: string) {
  const { data, error } = await supabaseAdmin
    .from('ApiCredential')
    .select('id, name, api_key, api_secret_hash, is_active, rate_limit_per_min, allowed_ips, expires_at')
    .eq('api_key', apiKey)
    .maybeSingle()

  if (error || !data) return { valid: false, reason: 'INVALID_API_KEY' as const }
  if (!data.is_active) return { valid: false, reason: 'API_KEY_REVOKED' as const }
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, reason: 'API_KEY_EXPIRED' as const }
  }

  return { valid: true, credential: data }
}

// ═══════════════════════════════════════════
// Validate Timestamp (clock skew)
// ═══════════════════════════════════════════
export function validateTimestamp(ts: number): boolean {
  if (!ts || typeof ts !== 'number') return false
  const now = Date.now()
  return Math.abs(now - ts) <= MAX_CLOCK_SKEW_MS
}

// ═══════════════════════════════════════════
// IP Allowlist
// ═══════════════════════════════════════════
export function isIpAllowed(
  ip: string | null,
  allowedIps: string[] | null
): boolean {
  if (!allowedIps || allowedIps.length === 0) return true
  if (!ip) return false
  return allowedIps.includes(ip)
}

// ═══════════════════════════════════════════
// Session
// ═══════════════════════════════════════════
export function generateSessionToken(): string {
  return crypto.randomBytes(48).toString('base64url')
}

export async function createApiSession({
  licenseKeyId,
  hwid,
  ip,
}: {
  licenseKeyId: string
  hwid: string
  ip: string | null
}): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await supabaseAdmin.from('ApiSession').insert({
    session_token: token,
    license_key_id: licenseKeyId,
    hwid,
    ip_address: ip,
    expires_at: expiresAt.toISOString(),
  })

  return { token, expiresAt }
}

export async function validateSession(
  token: string,
  hwid: string
): Promise<{
  valid: boolean
  reason?: string
  session?: {
    license_key_id: string
    hwid: string
    expires_at: string
  }
}> {
  const { data, error } = await supabaseAdmin
    .from('ApiSession')
    .select('license_key_id, hwid, expires_at')
    .eq('session_token', token)
    .maybeSingle()

  if (error || !data) return { valid: false, reason: 'SESSION_NOT_FOUND' }
  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, reason: 'SESSION_EXPIRED' }
  }
  if (data.hwid !== hwid) return { valid: false, reason: 'SESSION_HWID_MISMATCH' }

  // update last_used
  await supabaseAdmin
    .from('ApiSession')
    .update({ last_used_at: new Date().toISOString() })
    .eq('session_token', token)

  return { valid: true, session: data }
}

// ═══════════════════════════════════════════
// Logging
// ═══════════════════════════════════════════
export async function logApiRequest({
  endpoint,
  apiCredentialId,
  licenseKeyId,
  hwid,
  ip,
  userAgent,
  success,
  reason,
  latencyMs,
}: {
  endpoint: string
  apiCredentialId?: string
  licenseKeyId?: string
  hwid?: string
  ip?: string | null
  userAgent?: string | null
  success: boolean
  reason?: string
  latencyMs?: number
}) {
  try {
    await supabaseAdmin.from('ApiRequestLog').insert({
      endpoint,
      api_credential_id: apiCredentialId || null,
      license_key_id: licenseKeyId || null,
      hwid: hwid || null,
      ip_address: ip || null,
      user_agent: userAgent || null,
      success,
      reason: reason || null,
      latency_ms: latencyMs || null,
    })
  } catch (err) {
    console.error('Log API request failed:', err)
  }
}