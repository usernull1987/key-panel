'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/use-confirm'
import {
  ArrowLeft, Key, Copy, Eye, EyeOff,
  RefreshCw, Loader2, Calendar, Clock, Hash,
  AlertCircle, Monitor, Fingerprint, Globe,
  ShieldAlert, CheckCircle2,
} from 'lucide-react'

interface HwidItem {
  id: string
  hwid: string
  ip_address: string | null
  user_agent: string | null
  first_seen_at: string
  last_seen_at: string
}

interface LicenseKey {
  id: string
  key_code: string
  category: string
  prefix: string
  duration_value: number
  duration_unit: string
  max_hwid: number
  note: string | null
  is_active: boolean
  is_test: boolean
  first_used_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export default function KeyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const confirm = useConfirm()
  const id = params.id as string

  const [key, setKey] = useState<LicenseKey | null>(null)
  const [hwids, setHwids] = useState<HwidItem[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const [resetting, setResetting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/keys/' + id)
      if (res.status === 401) {
        window.location.href = '/login'
        return
      }
      if (res.status === 404) {
        toast.error('ไม่พบ License Key')
        router.push('/dashboard/keys')
        return
      }
      if (!res.ok) throw new Error()
      const json = await res.json()
      setKey(json.data.key)
      setHwids(json.data.hwids || [])
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleResetAll = () => {
    confirm({
      title: 'Reset HWID ทั้งหมด?',
      description:
        'จะลบ HWID ทั้งหมด ' +
        hwids.length +
        ' รายการออกจาก Key นี้\nผู้ใช้จะต้อง login ใหม่เพื่อผูก HWID อีกครั้ง',
      type: 'warning',
      confirmText: 'Reset ทั้งหมด',
      onConfirm: async () => {
        setResetting(true)
        try {
          const res = await fetch('/api/keys/' + id + '/reset-hwid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          })
          const json = await res.json()
          if (!res.ok) {
            toast.error(json.message || 'Reset ไม่สำเร็จ')
            throw new Error()
          }
          toast.success('Reset ' + json.deleted + ' HWID สำเร็จ')
          fetchData()
        } catch {
          throw new Error()
        } finally {
          setResetting(false)
        }
      },
    })
  }

  const handleResetOne = (hwid: string) => {
    confirm({
      title: 'Reset HWID นี้?',
      description:
        'HWID: ' +
        hwid.slice(0, 20) +
        '...\nผู้ใช้จะต้อง login ใหม่เพื่อผูก HWID อีกครั้ง',
      type: 'warning',
      confirmText: 'Reset HWID',
      onConfirm: async () => {
        setResetting(true)
        try {
          const res = await fetch('/api/keys/' + id + '/reset-hwid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hwid }),
          })
          const json = await res.json()
          if (!res.ok) {
            toast.error(json.message || 'Reset ไม่สำเร็จ')
            throw new Error()
          }
          toast.success('Reset HWID สำเร็จ')
          fetchData()
        } catch {
          throw new Error()
        } finally {
          setResetting(false)
        }
      },
    })
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('คัดลอกแล้ว')
  }

  const formatDateTime = (iso: string | null) => {
    if (!iso) return '-'
    return new Date(iso).toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!key) return null

  const isExpired = key.expires_at && new Date(key.expires_at) < new Date()
  const isPending = !key.first_used_at && key.is_active
  const status = !key.is_active
    ? { label: 'Revoked', color: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' }
    : isExpired
    ? { label: 'Expired', color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' }
    : isPending
    ? { label: 'Pending', color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400' }
    : { label: 'Active', color: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400' }

  return (
    <div>
      {/* Back */}
      <Link
        href="/dashboard/keys"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไป Keys
      </Link>

      {/* Header Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f0f] p-6 mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shrink-0">
              <Key className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white font-mono">
                  {visible ? key.key_code : key.key_code.slice(0, 8) + '••••-••••-' + key.key_code.slice(-4)}
                </h1>
                <button onClick={() => setVisible(!visible)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button onClick={() => copy(key.key_code)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  <Copy className="h-4 w-4" />
                </button>
                <span className={'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ' + status.color}>
                  {status.label}
                </span>
                {key.is_test && (
                  <span className="rounded bg-purple-100 dark:bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 dark:text-purple-400">
                    TEST
                  </span>
                )}
              </div>
              {key.note && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{key.note}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hwids.length > 0 && (
              <Button
                onClick={handleResetAll}
                disabled={resetting}
                variant="outline"
                className="h-9 rounded-lg border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20"
              >
                {resetting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                )}
                Reset HWID ทั้งหมด
              </Button>
            )}
          </div>
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-white/[0.04]">
          <DetailItem icon={Hash} label="หมวดหมู่" value={key.category} />
          <DetailItem icon={Clock} label="ระยะเวลา" value={key.duration_value + ' ' + key.duration_unit} />
          <DetailItem
            icon={Calendar}
            label="เริ่มใช้"
            value={formatDateTime(key.first_used_at)}
            highlight={!key.first_used_at}
          />
          <DetailItem
            icon={AlertCircle}
            label="หมดอายุ"
            value={formatDateTime(key.expires_at)}
            highlight={isExpired || false}
          />
        </div>
      </div>

      {/* HWID List */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f0f] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-slate-400" />
              HWID ที่ผูกอยู่
              <span className="rounded-full bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                {hwids.length} / {key.max_hwid}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              รายการอุปกรณ์ที่เคย login ด้วย Key นี้
            </p>
          </div>
        </div>

        {hwids.length === 0 ? (
          <div className="py-12 text-center">
            <Fingerprint className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              ยังไม่มี HWID
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              HWID จะถูกผูกเมื่อผู้ใช้เปิดโปรแกรมครั้งแรก
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {hwids.map((h, idx) => (
              <div
                key={h.id}
                className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/[0.06] dark:to-white/[0.03] text-slate-500 dark:text-slate-400">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        #{idx + 1}
                      </span>
                      <code className="font-mono text-xs text-slate-900 dark:text-white truncate max-w-md">
                        {h.hwid}
                      </code>
                      <button
                        onClick={() => copy(h.hwid)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Globe className="h-2.5 w-2.5" />
                        {h.ip_address || 'ไม่ทราบ IP'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        ครั้งแรก: {formatDateTime(h.first_seen_at)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        ล่าสุด: {formatDateTime(h.last_seen_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResetOne(h.hwid)}
                    disabled={resetting}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                    title="Reset HWID นี้"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <Icon className={'h-3 w-3 ' + (highlight ? 'text-amber-500' : 'text-slate-400')} />
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
      </div>
      <p className={'text-xs font-medium ' + (highlight ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white')}>
        {value}
      </p>
    </div>
  )
}