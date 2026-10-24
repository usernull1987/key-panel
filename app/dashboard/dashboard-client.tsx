'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Key, Users, TrendingUp, Ban, Clock, FlaskConical,
  Activity, RefreshCw, CheckCircle2, XCircle,
  ArrowRight, Zap, AlertCircle, Wifi, WifiOff,
  Send, BellOff, Settings, Infinity as InfinityIcon,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Log {
  id: number
  action: string
  hwid: string | null
  ip_address: string | null
  success: boolean
  message: string | null
  created_at: string
  LicenseKey?: { key_code: string }[] | null
}

interface RecentKey {
  id: string
  key_code: string
  category: string
  is_active: boolean
  is_test: boolean
  first_used_at: string | null
  expires_at: string | null
  created_at: string
  duration_value: number
  duration_unit: string
}

interface DashboardData {
  total: number
  active: number
  expired: number
  revoked: number
  pending: number
  hwid: number
  test: number
  verifies24h: number
  categories: Record<string, number>
  dailyVerifies: { day: string; count: number }[]
  recentKeys: RecentKey[]
  recentLogs: Log[]
  updatedAt: string
}

type ApiStatus = 'checking' | 'online' | 'offline'

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState<DashboardData>(initialData)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date(initialData.updatedAt))
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking')
  const [latency, setLatency] = useState<number | null>(null)
  const [telegramAlert, setTelegramAlert] = useState(true)
  const [togglingAlert, setTogglingAlert] = useState(false)
  const offlineCountRef = useRef(0)
  const hasAlertedRef = useRef(false)

  // ═══ Check API health ═══
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/health', { cache: 'no-store' })
      const json = await res.json()

      if (res.ok && json.status === 'ok') {
        setApiStatus('online')
        setLatency(json.latency)
        offlineCountRef.current = 0
        hasAlertedRef.current = false
      } else {
        throw new Error(json.message || 'API error')
      }
    } catch {
      setApiStatus('offline')
      setLatency(null)
      offlineCountRef.current++

      // ⭐ ถ้า offline ติดกัน 2 ครั้ง + ยังไม่แจ้งเตือน + เปิด alert
      if (offlineCountRef.current >= 2 && !hasAlertedRef.current && telegramAlert) {
        hasAlertedRef.current = true
        await fetch('/api/admin/telegram-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: true }),
        }).catch(() => {})

        // ⭐ ส่ง Telegram alert โดยตรง
        try {
          await fetch('/api/telegram/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message:
                '[ALERT] API DOWN\n' +
                'ระบบตรวจพบว่า API ไม่ตอบสนอง\n' +
                `เวลา: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`,
            }),
          })
        } catch {}
      }
    }
  }, [telegramAlert])

  // ═══ Refresh data ═══
  const refresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const res = await fetch('/api/dashboard/stats', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setData(json)
        setLastUpdate(new Date())
      }
    } catch {
      // silent fail
    } finally {
      setRefreshing(false)
    }
  }, [])

  // ═══ Toggle Telegram Alert ═══
  const toggleTelegramAlert = async () => {
    setTogglingAlert(true)
    try {
      const newValue = !telegramAlert
      const res = await fetch('/api/admin/telegram-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newValue }),
      })
      if (res.ok) {
        setTelegramAlert(newValue)
        toast.success(newValue ? 'เปิดแจ้งเตือน Telegram' : 'ปิดแจ้งเตือน Telegram')
      }
    } catch {
      toast.error('ไม่สามารถเปลี่ยนการตั้งค่าได้')
    } finally {
      setTogglingAlert(false)
    }
  }

  // ═══ Auto refresh ═══
  useEffect(() => {
    const interval = setInterval(() => {
      checkHealth()
      refresh(true)
    }, 30000)
    return () => clearInterval(interval)
  }, [checkHealth, refresh])

  // ═══ Initial health check ═══
  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'เมื่อกี้'
    if (mins < 60) return mins + ' นาทีที่แล้ว'
    const hours = Math.floor(mins / 60)
    if (hours < 24) return hours + ' ชม.ที่แล้ว'
    const days = Math.floor(hours / 24)
    return days + ' วันที่แล้ว'
  }

  const maxDaily = Math.max(...data.dailyVerifies.map((d) => d.count), 1)

  const primaryStats = [
    {
      label: 'Keys ทั้งหมด',
      value: data.total,
      sub: data.test + ' test',
      icon: Key,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'ใช้งานอยู่',
      value: data.active,
      sub: data.total > 0 ? Math.round((data.active / data.total) * 100) + '% ของทั้งหมด' : '—',
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      label: 'รอเปิดใช้',
      value: data.pending,
      sub: 'ยังไม่เริ่มนับเวลา',
      icon: Clock,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      label: 'หมดอายุ',
      value: data.expired,
      sub: 'ต้องต่ออายุ',
      icon: Ban,
      gradient: 'from-amber-500 to-orange-500',
    },
  ]

  const statusConfig = {
    checking: {
      icon: Wifi,
      label: 'กำลังเชื่อมต่อ...',
      color: 'text-slate-500 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-white/10',
      border: 'border-slate-200 dark:border-white/10',
      pulse: 'bg-slate-400',
    },
    online: {
      icon: Wifi,
      label: 'API ออนไลน์',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-500/10',
      border: 'border-green-200 dark:border-green-500/30',
      pulse: 'bg-green-500',
    },
    offline: {
      icon: WifiOff,
      label: 'API ออฟไลน์',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-500/10',
      border: 'border-red-200 dark:border-red-500/30',
      pulse: 'bg-red-500',
    },
  }

  const StatusIcon = statusConfig[apiStatus].icon
  const status = statusConfig[apiStatus]

  return (
    <div>
      {/* ═══ Header ═══ */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            ภาพรวมระบบ License Keys
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* API Status */}
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${status.bg} ${status.border}`}>
            <div className="relative flex h-2 w-2">
              {apiStatus === 'online' && (
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${status.pulse} opacity-75`} />
              )}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${status.pulse}`} />
            </div>
            <StatusIcon className={`h-3.5 w-3.5 ${status.color}`} />
            <span className={`text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
            {latency !== null && apiStatus === 'online' && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {latency}ms
              </span>
            )}
          </div>

          {/* Telegram toggle */}
          <button
            onClick={toggleTelegramAlert}
            disabled={togglingAlert}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
              telegramAlert
                ? 'border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-500 dark:text-slate-400'
            }`}
            title={telegramAlert ? 'ปิดแจ้งเตือน Telegram' : 'เปิดแจ้งเตือน Telegram'}
          >
            {telegramAlert ? <Send className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">
              {telegramAlert ? 'แจ้งเตือน: เปิด' : 'แจ้งเตือน: ปิด'}
            </span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => {
              refresh()
              checkHealth()
            }}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
        </div>
      </div>

      {/* ═══ Offline Warning Banner ═══ */}
      {apiStatus === 'offline' && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-red-700 dark:text-red-300">
            <p className="font-semibold mb-0.5">ไม่สามารถเชื่อมต่อกับ API ได้</p>
            <p className="text-red-700/80 dark:text-red-300/80">
              ระบบจะลองเชื่อมต่อใหม่ทุก 30 วินาที
              {telegramAlert && ' และแจ้งเตือน Telegram เมื่อล้มเหลวต่อเนื่อง'}
            </p>
          </div>
        </div>
      )}

      {/* ═══ Primary Stats ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {primaryStats.map((s, i) => {
          const Icon = s.icon
          return (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg group"
            >
              <div className={'absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ' + s.gradient + ' opacity-[0.08] blur-2xl group-hover:opacity-20 transition-opacity'} />
              <div
                className={'relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ' + s.gradient + ' mb-3 shadow-lg'}
              >
                <Icon className="h-4 w-4 text-white" />
              </div>
              <p className="relative text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                {s.label}
              </p>
              <p className="relative text-3xl font-bold text-slate-900 dark:text-white tabular-nums leading-none">
                {s.value.toLocaleString()}
              </p>
              <p className="relative text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                {s.sub}
              </p>
            </div>
          )
        })}
      </div>

      {/* ═══ Secondary Stats ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MiniCard
          icon={Activity}
          label="Verify 24 ชม."
          value={data.verifies24h}
          color="text-cyan-600 dark:text-cyan-400"
          bg="bg-cyan-100 dark:bg-cyan-500/20"
        />
        <MiniCard
          icon={Users}
          label="HWID ผูกแล้ว"
          value={data.hwid}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-100 dark:bg-blue-500/20"
        />
        <MiniCard
          icon={FlaskConical}
          label="Test Keys"
          value={data.test}
          color="text-purple-600 dark:text-purple-400"
          bg="bg-purple-100 dark:bg-purple-500/20"
        />
        <MiniCard
          icon={AlertCircle}
          label="ถูกระงับ"
          value={data.revoked}
          color="text-red-600 dark:text-red-400"
          bg="bg-red-100 dark:bg-red-500/20"
        />
      </div>

      {/* ═══ Charts Row ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                การใช้งาน 7 วันล่าสุด
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                จำนวนการ verify key ที่สำเร็จ
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="h-2 w-2 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Total: {data.dailyVerifies.reduce((s, d) => s + d.count, 0)}
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 h-32">
            {data.dailyVerifies.map((d, i) => {
              const height = maxDaily > 0 ? (d.count / maxDaily) * 100 : 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                    <div
                      className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-blue-500 to-cyan-400 transition-all hover:from-blue-600 hover:to-cyan-300 relative"
                      style={{ height: Math.max(height, 3) + '%' }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white dark:bg-[#0f0f0f] px-1.5 py-0.5 rounded shadow-lg">
                        {d.count}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{d.day}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            แยกตามหมวด
          </h3>
          <div className="space-y-3">
            {[
              { key: 'standard', label: 'Standard', color: 'from-slate-400 to-slate-600' },
              { key: 'premium', label: 'Premium', color: 'from-blue-400 to-blue-600' },
              { key: 'vip', label: 'VIP', color: 'from-amber-400 to-yellow-500' },
              { key: 'dev', label: 'Dev/Test', color: 'from-purple-400 to-purple-600' },
            ].map((c) => {
              const count = data.categories[c.key] || 0
              const total = Object.values(data.categories).reduce((s, v) => s + v, 0) || 1
              const pct = (count / total) * 100
              return (
                <div key={c.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {c.label}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {count} · {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <div
                      className={'h-full rounded-full bg-gradient-to-r ' + c.color + ' transition-all duration-500'}
                      style={{ width: pct + '%' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══ Recent Activity ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Keys ล่าสุด
            </h3>
            <Link
              href="/dashboard/keys"
              className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              ดูทั้งหมด
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {data.recentKeys.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">ไม่มีข้อมูล</div>
            ) : (
              data.recentKeys.map((k) => (
                <div key={k.id} className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <code className="text-xs font-mono font-medium text-slate-900 dark:text-white">
                      {k.key_code}
                    </code>
                    {k.is_test && (
                      <span className="rounded bg-purple-100 dark:bg-purple-500/20 px-1 py-0.5 text-[8px] font-bold text-purple-700 dark:text-purple-400">
                        TEST
                      </span>
                    )}
                    {k.duration_value === 0 && (
                      <span className="rounded bg-green-100 dark:bg-green-500/20 px-1 py-0.5 text-[8px] font-bold text-green-700 dark:text-green-400 flex items-center gap-0.5">
                        <InfinityIcon className="h-2 w-2" />
                        LIFETIME
                      </span>
                    )}
                    {!k.is_active ? (
                      <span className="rounded bg-red-100 dark:bg-red-500/20 px-1.5 py-0.5 text-[9px] font-medium text-red-700 dark:text-red-400">Revoked</span>
                    ) : k.first_used_at ? (
                      <span className="rounded bg-green-100 dark:bg-green-500/20 px-1.5 py-0.5 text-[9px] font-medium text-green-700 dark:text-green-400">Active</span>
                    ) : (
                      <span className="rounded bg-purple-100 dark:bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-medium text-purple-700 dark:text-purple-400">Pending</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>{k.category} · {k.duration_value === 0 ? 'ถาวร' : `${k.duration_value} ${k.duration_unit}`}</span>
                    <span>{formatRelative(k.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              กิจกรรมล่าสุด
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              live
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/[0.04] max-h-80 overflow-y-auto">
            {data.recentLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">ไม่มีกิจกรรม</div>
            ) : (
              data.recentLogs.map((log) => (
                <div key={log.id} className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-2">
                    <div className={'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ' + (log.success ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20')}>
                      {log.success ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-900 dark:text-white">
                        {log.action === 'verify' ? 'ตรวจสอบ Key' :
                         log.action === 'activate' ? 'เปิดใช้งานครั้งแรก' :
                         log.action === 'revoke' ? 'ระงับ Key' :
                         log.action === 'extend' ? 'ต่ออายุ Key' : log.action}
                        {log.LicenseKey && log.LicenseKey.length > 0 && (
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 ml-1">
                            {log.LicenseKey[0].key_code}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {log.hwid && 'HWID: ' + log.hwid.slice(0, 12) + '... '}
                        {log.ip_address && '· ' + log.ip_address}
                      </p>
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {formatRelative(log.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
  bg: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={'flex h-7 w-7 items-center justify-center rounded-lg ' + bg}>
          <Icon className={'h-3.5 w-3.5 ' + color} />
        </div>
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
        {value.toLocaleString()}
      </p>
    </div>
  )
}