'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/use-confirm'
import {
  Key, Plus, Copy, Eye, EyeOff, Trash2, Ban,
  Shield, Loader2, X, Send, Activity,
  AlertCircle, CheckCircle2, Clock, Globe,
  ShieldAlert,
} from 'lucide-react'

interface ApiCredential {
  id: string
  name: string
  api_key: string
  is_active: boolean
  rate_limit_per_min: number
  allowed_ips: string[] | null
  expires_at: string | null
  last_used_at: string | null
  created_at: string
}

export default function ApiClientsPage() {
  const confirm = useConfirm()
  const [creds, setCreds] = useState<ApiCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [created, setCreated] = useState<ApiCredential | null>(null)
  const [visible, setVisible] = useState<Set<string>>(new Set())

  const [name, setName] = useState('')
  const [rateLimit, setRateLimit] = useState('60')
  const [allowedIps, setAllowedIps] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [notifyTelegram, setNotifyTelegram] = useState(true)
  const [creating, setCreating] = useState(false)

  const fetchCreds = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/api-credentials')
      if (res.status === 401) {
        window.location.href = '/login'
        return
      }
      const json = await res.json()
      setCreds(json.data || [])
    } catch {
      toast.error('โหลดไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCreds()
  }, [fetchCreds])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/admin/api-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          rate_limit_per_min: parseInt(rateLimit) || 60,
          allowed_ips: allowedIps.trim()
            ? allowedIps.split(',').map((s) => s.trim()).filter(Boolean)
            : null,
          expires_at: expiresAt || null,
          notify_telegram: notifyTelegram,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.message || 'สร้างไม่สำเร็จ')
        return
      }
      setCreated(json.data)
      toast.success('สร้าง API Key สำเร็จ')
      fetchCreds()
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้')
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = (id: string, credName: string) => {
    confirm({
      title: 'ระงับ API Key?',
      description: 'Client "' + credName + '" จะไม่สามารถเรียก API ได้อีก\n(เปิดใช้งานใหม่ได้ภายหลัง)',
      type: 'warning',
      confirmText: 'ระงับ',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/api-credentials/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: false }),
          })
          if (!res.ok) throw new Error()
          toast.success('ระงับสำเร็จ')
          fetchCreds()
        } catch {
          toast.error('ระงับไม่สำเร็จ')
          throw new Error('Failed')
        }
      },
    })
  }

  const handleActivate = (id: string, credName: string) => {
    confirm({
      title: 'เปิดใช้งาน API Key?',
      description: 'Client "' + credName + '" จะสามารถเรียก API ได้อีกครั้ง',
      type: 'success',
      confirmText: 'เปิดใช้งาน',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/api-credentials/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: true }),
          })
          if (!res.ok) throw new Error()
          toast.success('เปิดใช้งานสำเร็จ')
          fetchCreds()
        } catch {
          toast.error('เปิดไม่สำเร็จ')
          throw new Error('Failed')
        }
      },
    })
  }

  const handleDelete = (id: string, credName: string) => {
    confirm({
      title: 'ลบ API Key?',
      description: 'Client "' + credName + '" จะถูกลบถาวร\nไม่สามารถกู้คืนได้',
      type: 'danger',
      confirmText: 'ลบถาวร',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/api-credentials/' + id, { method: 'DELETE' })
          if (!res.ok) throw new Error()
          toast.success('ลบสำเร็จ')
          fetchCreds()
        } catch {
          toast.error('ลบไม่สำเร็จ')
          throw new Error('Failed')
        }
      },
    })
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('คัดลอกแล้ว')
  }

  const toggleVisible = (id: string) => {
    const next = new Set(visible)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setVisible(next)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            API Clients
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            API Keys สำหรับโปรแกรม C++ - ใช้เชื่อมต่อกับเว็บ
          </p>
        </div>
        <Button
          onClick={() => {
            setShowCreate(true)
            setCreated(null)
            setName('')
            setRateLimit('60')
            setAllowedIps('')
            setExpiresAt('')
            setNotifyTelegram(true)
          }}
          className="h-9 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          สร้าง API Key
        </Button>
      </div>

      {/* Info banner */}
      <div className="mb-4 rounded-xl border border-blue-200/60 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/[0.06] p-3.5">
        <div className="flex items-start gap-2.5">
          <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <p className="font-semibold mb-0.5 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" />
              ความปลอดภัยสูงสุด
            </p>
            <p className="text-blue-700/80 dark:text-blue-300/80">
              ทุก request ต้องมี HMAC Signature + Timestamp + Nonce - ป้องกันการดักจับและ Replay Attack
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : creds.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f0f] py-16 text-center">
          <Key className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            ยังไม่มี API Key
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            สร้างเพื่อเชื่อมต่อโปรแกรม C++
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {creds.map((c) => {
            const isVisible = visible.has(c.id)
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f0f] p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {c.name}
                      </p>
                      {c.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-400">
                          <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-50 dark:bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-400">
                          Revoked
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <code className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md">
                        {isVisible
                          ? c.api_key
                          : c.api_key.slice(0, 12) + '••••••••••••' + c.api_key.slice(-4)}
                      </code>
                      <button
                        onClick={() => toggleVisible(c.id)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        {isVisible ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() => copy(c.api_key)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {c.is_active ? (
                      <button
                        onClick={() => handleRevoke(c.id, c.name)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                        title="ระงับ"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(c.id, c.name)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10"
                        title="เปิดใช้งาน"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                      title="ลบ"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
                  <Meta icon={Activity} label="Rate Limit" value={c.rate_limit_per_min + '/min'} />
                  <Meta
                    icon={Globe}
                    label="IP Allowlist"
                    value={c.allowed_ips?.length ? c.allowed_ips.length + ' IPs' : 'ทุก IP'}
                  />
                  <Meta
                    icon={Clock}
                    label="ใช้ล่าสุด"
                    value={
                      c.last_used_at
                        ? new Date(c.last_used_at).toLocaleString('th-TH', {
                            timeZone: 'Asia/Bangkok',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'
                    }
                  />
                  <Meta
                    icon={AlertCircle}
                    label="หมดอายุ"
                    value={
                      c.expires_at
                        ? new Date(c.expires_at).toLocaleDateString('th-TH')
                        : 'ไม่หมด'
                    }
                    highlight={c.expires_at ? new Date(c.expires_at) < new Date() : false}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => !creating && setShowCreate(false)}
          />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-xl border-b border-slate-100 dark:border-white/[0.06] px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {created ? 'สร้าง API Key สำเร็จ!' : 'สร้าง API Key ใหม่'}
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {created ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <ShieldAlert className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                        คัดลอก API Key เก็บไว้ - จะไม่แสดงอีกครั้ง
                      </p>
                    </div>
                    <div className="rounded-md bg-white dark:bg-[#0a0a0a] border border-green-200 dark:border-green-500/20 p-3">
                      <p className="font-mono text-[11px] text-slate-900 dark:text-white break-all">
                        {created.api_key}
                      </p>
                    </div>
                    <button
                      onClick={() => copy(created.api_key)}
                      className="mt-2 w-full h-8 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-medium flex items-center justify-center gap-1.5"
                    >
                      <Copy className="h-3 w-3" />
                      คัดลอก API Key
                    </button>
                  </div>
                  <Button
                    onClick={() => setShowCreate(false)}
                    className="w-full h-10 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  >
                    เสร็จสิ้น
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      ชื่อ Client *
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="เช่น C++ Client v1"
                      className="h-10 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 text-sm focus:border-slate-900 dark:focus:border-white/40 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Rate Limit (req/min)
                    </label>
                    <input
                      type="number"
                      value={rateLimit}
                      onChange={(e) => setRateLimit(e.target.value)}
                      min="1"
                      max="1000"
                      className="h-10 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 text-sm focus:border-slate-900 dark:focus:border-white/40 focus:outline-none"
                    />
                    <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                      จำนวน request สูงสุดต่อนาที
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      IP Allowlist (ไม่บังคับ)
                    </label>
                    <input
                      value={allowedIps}
                      onChange={(e) => setAllowedIps(e.target.value)}
                      placeholder="1.2.3.4, 5.6.7.8"
                      className="h-10 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 text-sm focus:border-slate-900 dark:focus:border-white/40 focus:outline-none"
                    />
                    <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                      เว้นว่าง = ยอมรับทุก IP
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      วันหมดอายุ (ไม่บังคับ)
                    </label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 text-sm focus:border-slate-900 dark:focus:border-white/40 focus:outline-none"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 rounded-xl border border-blue-200/60 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/[0.06] p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyTelegram}
                      onChange={(e) => setNotifyTelegram(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded accent-blue-600"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                          แจ้งเตือน Telegram
                        </p>
                      </div>
                      <p className="text-[10px] text-blue-700/70 dark:text-blue-300/70 mt-0.5">
                        ส่งการแจ้งเตือนเมื่อสร้าง / ระงับ / ลบ API Key
                      </p>
                    </div>
                  </label>

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreate(false)}
                      disabled={creating}
                      className="flex-1 h-10 rounded-lg"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={creating || !name.trim()}
                      className="flex-1 h-10 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                    >
                      {creating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'สร้าง'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Meta({
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
      <div className="flex items-center gap-1 mb-0.5">
        <Icon
          className={
            'h-2.5 w-2.5 ' +
            (highlight ? 'text-red-500' : 'text-slate-400')
          }
        />
        <p className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">
          {label}
        </p>
      </div>
      <p
        className={
          'text-[11px] font-medium truncate ' +
          (highlight
            ? 'text-red-600 dark:text-red-400'
            : 'text-slate-700 dark:text-slate-300')
        }
      >
        {value}
      </p>
    </div>
  )
}