import { connection } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { DashboardClient } from './dashboard-client'

export const instant = false

export default async function DashboardPage() {
  await connection()

  const now = new Date().toISOString()
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // ═══════ ดึงข้อมูลทั้งหมดแบบ parallel ═══════
  const [
    totalRes,
    activeRes,
    expiredRes,
    revokedRes,
    pendingRes,
    hwidRes,
    testRes,
    recentKeysRes,
    recentLogsRes,
    categoryRes,
    hourlyVerifyRes,
  ] = await Promise.all([
    // Keys ทั้งหมด
    supabaseAdmin.from('LicenseKey').select('*', { count: 'exact', head: true }),
    // ใช้งานอยู่ (active + ยังไม่หมดอายุ + เริ่มใช้แล้ว)
    supabaseAdmin
      .from('LicenseKey')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('first_used_at', 'is', null)
      .or('expires_at.is.null,expires_at.gt.' + now),
    // หมดอายุ
    supabaseAdmin
      .from('LicenseKey')
      .select('*', { count: 'exact', head: true })
      .not('expires_at', 'is', null)
      .lt('expires_at', now),
    // ถูกระงับ
    supabaseAdmin
      .from('LicenseKey')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false),
    // รอใช้ (pending)
    supabaseAdmin
      .from('LicenseKey')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('first_used_at', null),
    // HWID ผูก
    supabaseAdmin.from('KeyHwid').select('*', { count: 'exact', head: true }),
    // Test keys
    supabaseAdmin
      .from('LicenseKey')
      .select('*', { count: 'exact', head: true })
      .eq('is_test', true),
    // 5 keys ล่าสุด
    supabaseAdmin
      .from('LicenseKey')
      .select('id, key_code, category, is_active, is_test, first_used_at, expires_at, created_at, duration_value, duration_unit')
      .order('created_at', { ascending: false })
      .limit(5),
    // 5 logs ล่าสุด
    supabaseAdmin
      .from('KeyLog')
      .select('id, action, hwid, ip_address, success, message, created_at, LicenseKey(key_code)')
      .order('created_at', { ascending: false })
      .limit(10),
    // แยกตาม category
    supabaseAdmin
      .from('LicenseKey')
      .select('category')
      .eq('is_active', true),
    // verify ใน 24 ชม ล่าสุด
    supabaseAdmin
      .from('KeyLog')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'verify')
      .eq('success', true)
      .gte('created_at', last24h),
  ])

  // ═══════ คำนวณ category breakdown ═══════
  const catCounts = (categoryRes.data ?? []).reduce((acc: any, row: any) => {
    acc[row.category] = (acc[row.category] || 0) + 1
    return acc
  }, {})

  // ═══════ คำนวณ verify 7 วัน ═══════
  const { data: verify7d } = await supabaseAdmin
    .from('KeyLog')
    .select('created_at')
    .eq('action', 'verify')
    .eq('success', true)
    .gte('created_at', last7d)

  const dailyVerifies: { day: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const dayKey = d.toISOString().split('T')[0]
    const dayLabel = d.toLocaleDateString('th-TH', { weekday: 'short' })
    const count = (verify7d ?? []).filter((l: any) =>
      l.created_at.startsWith(dayKey)
    ).length
    dailyVerifies.push({ day: dayLabel, count })
  }

  const stats = {
    total: totalRes.count ?? 0,
    active: activeRes.count ?? 0,
    expired: expiredRes.count ?? 0,
    revoked: revokedRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    hwid: hwidRes.count ?? 0,
    test: testRes.count ?? 0,
    verifies24h: hourlyVerifyRes.count ?? 0,
    categories: catCounts,
    dailyVerifies,
    recentKeys: recentKeysRes.data ?? [],
    recentLogs: recentLogsRes.data ?? [],
    updatedAt: now,
  }

  return <DashboardClient initialData={stats} />
}