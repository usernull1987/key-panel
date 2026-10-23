'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/use-confirm'
import {
  Key, Plus, Copy, Eye, EyeOff, Trash2, Ban,
  CheckCircle2, Clock, AlertCircle, RefreshCw,
  Search, X, Loader2, CalendarPlus, FlaskConical,
  ChevronRight, Filter, MoreHorizontal, Activity,
  TrendingUp, Zap, ListChecks,
} from 'lucide-react'
import { DURATION_UNITS, DurationUnit } from '@/lib/keys'

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
  KeyHwid: { hwid: string; last_seen_at: string }[]
}

type FilterStatus = 'all' | 'active' | 'pending' | 'expired' | 'revoked'

const STATUS_TABS: { id: FilterStatus; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'ทั้งหมด', icon: ListChecks },
  { id: 'active', label: 'ใช้งาน', icon: Activity },
  { id: 'pending', label: 'รอใช้', icon: Clock },
  { id: 'expired', label: 'หมดอายุ', icon: AlertCircle },
  { id: 'revoked', label: 'ระงับ', icon: Ban },
]

const CATEGORIES = [
  { value: 'standard', label: 'Standard', dot: 'bg-slate-500', bg: 'bg-slate-50 dark:bg-slate-500/10', text: 'text-slate-700 dark:text-slate-300' },
  { value: 'premium', label: 'Premium', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-300' },
  { value: 'vip', label: 'VIP', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300' },
  { value: 'dev', label: 'Dev', dot: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-700 dark:text-purple-300' },
]

export default function KeysPage() {
  const confirm = useConfirm()
  const [keys, setKeys] = useState<LicenseKey[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createdKeys, setCreatedKeys] = useState<string[] | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [actionMenu, setActionMenu] = useState<string | null>(null)
  const [extendKey, setExtendKey] = useState<LicenseKey | null>(null)

  // Create form
  const [newCategory, setNewCategory] = useState('standard')
  const [newPrefix, setNewPrefix] = useState('NX')
  const [newDurationValue, setNewDurationValue] = useState('30')
  const [newDurationUnit, setNewDurationUnit] = useState<DurationUnit>('day')
  const [newMaxHwid, setNewMaxHwid] = useState('1')
  const [newNote, setNewNote] = useState('')
  const [newQuantity, setNewQuantity] = useState('1')
  const [newIsTest, setNewIsTest] = useState(false)
  const [customKey, setCustomKey] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: search,
        category: 'all',
        status: filterStatus,
        page: String(page),
      })
      const res = await fetch('/api/keys?' + params.toString())
      if (res.status === 401) {
        window.location.href = '/login'
        return
      }
      if (!res.ok) throw new Error()
      const json = await res.json()
      setKeys(json.data || [])
      setTotalPages(json.pagination?.totalPages || 1)
    } catch {
      toast.error('ไม่สามารถโหลด keys ได้')
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, page])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  // Close action menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-action-menu]')) {
        setActionMenu(null)
      }
    }
    if (actionMenu) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [actionMenu])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          prefix: newPrefix,
          duration_value: parseInt(newDurationValue) || 1,
          duration_unit: newDurationUnit,
          max_hwid: parseInt(newMaxHwid) || 1,
          note: newNote.trim(),
          quantity: customKey ? 1 : parseInt(newQuantity) || 1,
          is_test: newIsTest,
          custom_key: customKey.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.message || 'สร้างไม่สำเร็จ')
        return
      }
      setCreatedKeys(json.keys)
      toast.success('สร้าง ' + json.keys.length + ' keys สำเร็จ')
      fetchKeys()
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้')
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = (id: string) => {
    setActionMenu(null)
    confirm({
      title: 'ระงับ License Key?',
      description: 'Key นี้จะไม่สามารถใช้งานได้ทันที\n(สามารถเปิดใช้งานใหม่ภายหลังได้)',
      type: 'warning',
      confirmText: 'ระงับ Key',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/keys/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: false }),
          })
          if (!res.ok) throw new Error()
          toast.success('ระงับ Key สำเร็จ')
          fetchKeys()
        } catch {
          toast.error('ระงับไม่สำเร็จ')
          throw new Error('Revoke failed')
        }
      },
    })
  }

  const handleActivate = (id: string) => {
    setActionMenu(null)
    confirm({
      title: 'เปิดใช้งาน License Key?',
      description: 'Key นี้จะสามารถใช้งานได้อีกครั้ง',
      type: 'success',
      confirmText: 'เปิดใช้งาน',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/keys/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: true }),
          })
          if (!res.ok) throw new Error()
          toast.success('เปิดใช้งานสำเร็จ')
          fetchKeys()
        } catch {
          toast.error('เปิดไม่สำเร็จ')
          throw new Error('Activate failed')
        }
      },
    })
  }

  const handleDelete = (id: string) => {
    setActionMenu(null)
    confirm({
      title: 'ลบ License Key?',
      description: 'การลบจะไม่สามารถกู้คืนได้\nข้อมูล HWID และ Log ทั้งหมดจะถูกลบ',
      type: 'danger',
      confirmText: 'ลบถาวร',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/keys/' + id, { method: 'DELETE' })
          if (!res.ok) throw new Error()
          toast.success('ลบ Key สำเร็จ')
          fetchKeys()
        } catch {
          toast.error('ลบไม่สำเร็จ')
          throw new Error('Delete failed')
        }
      },
    })
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('คัดลอกแล้ว')
  }

  const toggleVisibility = (id: string) => {
    const next = new Set(visibleKeys)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setVisibleKeys(next)
  }

  const maskKey = (code: string) => code.slice(0, 8) + '••••-••••-' + code.slice(-4)
  const isExpired = (k: LicenseKey) => k.expires_at && new Date(k.expires_at) < new Date()
  const isPending = (k: LicenseKey) => !k.first_used_at && k.is_active

  const getStatus = (k: LicenseKey) => {
    if (!k.is_active) return { label: 'Revoked', color: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30' }
    if (isExpired(k)) return { label: 'Expired', color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' }
    if (isPending(k)) return { label: 'Pending', color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30' }
    return { label: 'Active', color: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30' }
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

  const resetForm = () => {
    setCreatedKeys(null)
    setCustomKey('')
    setNewCategory('standard')
    setNewPrefix('NX')
    setNewDurationValue('30')
    setNewDurationUnit('day')
    setNewMaxHwid('1')
    setNewNote('')
    setNewQuantity('1')
    setNewIsTest(false)
  }

  return (
    <div>
      {/* ═══ Header ═══ */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">License Keys</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            เวลาจะเริ่มนับเมื่อ Key ถูกใช้ครั้งแรก (Asia/Bangkok)
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowCreateModal(true)
          }}
          className="h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          สร้าง Keys
        </Button>
      </div>

      {/* ═══ Search + Refresh ═══ */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="ค้นหา Key..."
            className="h-11 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] pl-10 pr-10 text-sm focus:border-slate-900 dark:focus:border-white/40 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20"
            >
              <X className="h-3 w-3 text-slate-500 dark:text-slate-400" />
            </button>
          )}
        </div>
        <button
          onClick={fetchKeys}
          disabled={loading}
          className="h-11 w-11 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          title="รีเฟรช"
        >
          <RefreshCw className={'h-4 w-4 text-slate-500 dark:text-slate-400 ' + (loading ? 'animate-spin' : '')} />
        </button>
      </div>

      {/* ═══ Status Tabs ═══ */}
      <div className="mb-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] gap-1">
          {STATUS_TABS.map((tab) => {
            const active = filterStatus === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => { setFilterStatus(tab.id); setPage(1) }}
                className={
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ' +
                  (active
                    ? 'bg-white dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══ Table ═══ */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f0f] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
            <p className="text-xs text-slate-400">กำลังโหลด...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="py-20 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-white/[0.04] mb-3">
              <Key className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              {search || filterStatus !== 'all' ? 'ไม่พบ Keys ที่ตรงเงื่อนไข' : 'ยังไม่มี Keys'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {search || filterStatus !== 'all'
                ? 'ลองเปลี่ยน filter หรือค้นหาใหม่'
                : 'กดปุ่ม "สร้าง Keys" เพื่อเริ่มต้น'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06]">
                  <tr>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Key</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">หมวด</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">HWID</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">เริ่มใช้</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">หมดอายุ</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => {
                    const status = getStatus(k)
                    const isVisible = visibleKeys.has(k.id)
                    const catInfo = CATEGORIES.find((c) => c.value === k.category)
                    return (
                      <tr
                        key={k.id}
                        className="border-b border-slate-100 dark:border-white/[0.04] hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <code className="font-mono text-xs font-medium text-slate-900 dark:text-white">
                              {isVisible ? k.key_code : maskKey(k.key_code)}
                            </code>
                            <button
                              onClick={() => toggleVisibility(k.id)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                              title={isVisible ? 'ซ่อน' : 'แสดง'}
                            >
                              {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                            <button
                              onClick={() => copy(k.key_code)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                              title="คัดลอก"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            {k.is_test && (
                              <span className="rounded bg-purple-100 dark:bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 dark:text-purple-400">
                                TEST
                              </span>
                            )}
                          </div>
                          {k.note && (
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{k.note}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ' + status.color}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className={'inline-flex items-center gap-1.5 rounded-md px-2 py-1 ' + catInfo?.bg}>
                            <div className={'h-1.5 w-1.5 rounded-full ' + catInfo?.dot} />
                            <span className={'text-[11px] font-medium ' + catInfo?.text}>
                              {catInfo?.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs tabular-nums text-slate-600 dark:text-slate-400">
                            {k.KeyHwid?.length || 0}/{k.max_hwid}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {formatDateTime(k.first_used_at)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className={'text-[11px] ' + (isExpired(k) ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-slate-500 dark:text-slate-400')}>
                              {formatDateTime(k.expires_at)}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {k.duration_value} {k.duration_unit}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end" data-action-menu>
                            <Link
                              href={'/dashboard/keys/' + k.id}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white transition-colors"
                              title="ดูรายละเอียด"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              onClick={() => setExtendKey(k)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                              title="เพิ่มเวลา"
                            >
                              <CalendarPlus className="h-3.5 w-3.5" />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setActionMenu(actionMenu === k.id ? null : k.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                                title="เพิ่มเติม"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </button>
                              {actionMenu === k.id && (
                                <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] shadow-xl p-1.5">
                                  {k.is_active ? (
                                    <button
                                      onClick={() => handleRevoke(k.id)}
                                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                    >
                                      <Ban className="h-3.5 w-3.5" />
                                      ระงับ Key
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleActivate(k.id)}
                                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      เปิดใช้งาน
                                    </button>
                                  )}
                                  <div className="h-px bg-slate-100 dark:bg-white/[0.06] my-1" />
                                  <button
                                    onClick={() => handleDelete(k.id)}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    ลบถาวร
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-slate-100 dark:divide-white/[0.04]">
              {keys.map((k) => {
                const status = getStatus(k)
                const isVisible = visibleKeys.has(k.id)
                const catInfo = CATEGORIES.find((c) => c.value === k.category)
                return (
                  <div key={k.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    {/* Row 1: Key + Status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <code className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                          {isVisible ? k.key_code : maskKey(k.key_code)}
                        </code>
                        <button onClick={() => toggleVisibility(k.id)} className="text-slate-400">
                          {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                        <button onClick={() => copy(k.key_code)} className="text-slate-400">
                          <Copy className="h-3 w-3" />
                        </button>
                        {k.is_test && (
                          <span className="rounded bg-purple-100 dark:bg-purple-500/20 px-1 py-0.5 text-[9px] font-bold text-purple-700 dark:text-purple-400">TEST</span>
                        )}
                      </div>
                      <span className={'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ' + status.color}>
                        {status.label}
                      </span>
                    </div>

                    {/* Row 2: Category + HWID */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 ' + catInfo?.bg}>
                        <div className={'h-1.5 w-1.5 rounded-full ' + catInfo?.dot} />
                        <span className={'text-[10px] font-medium ' + catInfo?.text}>{catInfo?.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        HWID: {k.KeyHwid?.length || 0}/{k.max_hwid}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {k.duration_value} {k.duration_unit}
                      </span>
                    </div>

                    {/* Row 3: Dates */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
                      <div>
                        <p className="text-slate-400 uppercase tracking-wider mb-0.5">เริ่มใช้</p>
                        <p className="text-slate-700 dark:text-slate-300">{formatDateTime(k.first_used_at)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 uppercase tracking-wider mb-0.5">หมดอายุ</p>
                        <p className={isExpired(k) ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-slate-700 dark:text-slate-300'}>
                          {formatDateTime(k.expires_at)}
                        </p>
                      </div>
                    </div>

                    {/* Row 4: Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={'/dashboard/keys/' + k.id}
                        className="flex flex-1 items-center justify-center gap-1.5 h-8 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                        ดู
                      </Link>
                      <button
                        onClick={() => setExtendKey(k)}
                        className="flex flex-1 items-center justify-center gap-1.5 h-8 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        เพิ่มเวลา
                      </button>
                      <button
                        onClick={() => k.is_active ? handleRevoke(k.id) : handleActivate(k.id)}
                        className={
                          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors ' +
                          (k.is_active
                            ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                            : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10')
                        }
                      >
                        {k.is_active ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(k.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01]">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              หน้า {page} จาก {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-white dark:hover:bg-white/[0.04] transition-colors"
              >
                ก่อนหน้า
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-white dark:hover:bg-white/[0.04] transition-colors"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ CREATE MODAL ═══ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => !creating && setShowCreateModal(false)} />
          <div className="relative w-full sm:max-w-lg bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 rounded-t-3xl sm:rounded-t-2xl" />

            <div className="sticky top-0 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-xl border-b border-slate-100 dark:border-white/[0.06] px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {createdKeys ? 'สร้างสำเร็จ!' : 'สร้าง License Keys'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {createdKeys ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                        สร้าง {createdKeys.length} keys สำเร็จ
                      </p>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {createdKeys.map((key, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-md bg-white dark:bg-[#0a0a0a] border border-green-200 dark:border-green-500/20 p-2">
                          <code className="flex-1 font-mono text-[11px] text-slate-900 dark:text-white break-all">{key}</code>
                          <button onClick={() => copy(key)} className="shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => copy(createdKeys.join('\n'))} className="mt-2 w-full h-8 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-medium">
                      คัดลอกทั้งหมด
                    </button>
                  </div>
                  <Button onClick={() => setShowCreateModal(false)} className="w-full h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900">
                    เสร็จสิ้น
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">หมวดหมู่</label>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => { setNewCategory(c.value); setNewIsTest(c.value === 'dev') }}
                          className={
                            'flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ' +
                            (newCategory === c.value
                              ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-white/[0.06]'
                              : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.02]')
                          }
                        >
                          <div className={'h-2 w-2 rounded-full ' + c.dot} />
                          <span className="text-xs font-medium text-slate-900 dark:text-white">{c.label}</span>
                          {c.value === 'dev' && <FlaskConical className="h-3 w-3 text-purple-500 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">คำนำหน้า</label>
                      <input
                        value={newPrefix}
                        onChange={(e) => setNewPrefix(e.target.value.toUpperCase().slice(0, 8))}
                        placeholder="NX"
                        maxLength={8}
                        className="h-10 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 text-sm font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                        {customKey ? 'จำนวน' : 'จำนวน (1-100)'}
                      </label>
                      <input
                        type="number"
                        value={customKey ? '1' : newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        disabled={!!customKey}
                        min="1"
                        max="100"
                        className="h-10 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 text-sm disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      ระยะเวลา <span className="text-slate-400 font-normal">(เริ่มนับเมื่อใช้ครั้งแรก)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={newDurationValue}
                        onChange={(e) => setNewDurationValue(e.target.value)}
                        min="1"
                        className="h-10 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 text-sm"
                      />
                      <select
                        value={newDurationUnit}
                        onChange={(e) => setNewDurationUnit(e.target.value as DurationUnit)}
                        className="h-10 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 text-sm"
                      >
                        {DURATION_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">จำนวน HWID</label>
                    <input
                      type="number"
                      value={newMaxHwid}
                      onChange={(e) => setNewMaxHwid(e.target.value)}
                      min="1"
                      className="h-10 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">หมายเหตุ</label>
                    <input
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="เช่น สำหรับลูกค้า A"
                      className="h-10 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      กำหนด Key เอง <span className="text-slate-400 font-normal">(เว้นว่าง = สร้างอัตโนมัติ)</span>
                    </label>
                    <input
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value.toUpperCase())}
                      placeholder="MY-KEY-1234"
                      className="h-10 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 text-sm font-mono"
                    />
                  </div>

                  <label className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-xs font-medium text-slate-900 dark:text-white">Test Key (Dev)</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">สำหรับทดสอบโปรแกรม</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={newIsTest}
                      onChange={(e) => setNewIsTest(e.target.checked)}
                      className="h-4 w-4 rounded accent-purple-600"
                    />
                  </label>

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={creating} className="flex-1 h-10 rounded-xl">
                      ยกเลิก
                    </Button>
                    <Button onClick={handleCreate} disabled={creating} className="flex-1 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900">
                      {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'สร้าง'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ EXTEND MODAL ═══ */}
      {extendKey && (
        <ExtendModal
          licenseKey={extendKey}
          onClose={() => setExtendKey(null)}
          onSuccess={() => { setExtendKey(null); fetchKeys() }}
        />
      )}
    </div>
  )
}

function ExtendModal({
  licenseKey,
  onClose,
  onSuccess,
}: {
  licenseKey: LicenseKey
  onClose: () => void
  onSuccess: () => void
}) {
  const [value, setValue] = useState('7')
  const [unit, setUnit] = useState<DurationUnit>('day')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/keys/' + licenseKey.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extend',
          extend_value: parseInt(value),
          extend_unit: unit,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.message || 'ไม่สำเร็จ')
        return
      }
      toast.success('เพิ่มเวลาสำเร็จ')
      onSuccess()
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => !loading && onClose()} />
      <div className="relative w-full max-w-sm bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-5 animate-[scaleIn_0.2s_ease-out]">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
            <CalendarPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">เพิ่มเวลา</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {licenseKey.first_used_at ? 'เพิ่มจากวันหมดอายุเดิม' : 'จะเพิ่มตอนใช้ครั้งแรก'}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min="1"
              className="h-10 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 text-sm"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as DurationUnit)}
              className="h-10 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 text-sm"
            >
              {DURATION_UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 h-10 rounded-lg">ยกเลิก</Button>
            <Button onClick={submit} disabled={loading} className="flex-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'เพิ่มเวลา'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}