'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Bell, Send, CheckCircle2, XCircle, Trash2, Settings,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'info'
  created_at: string
  read: boolean
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Fetch notifications
  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/notifications')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setNotifications(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
      setNotifications(notifications.map((n) => ({ ...n, read: true })))
      toast.success('อ่านทั้งหมดแล้ว')
    } catch {
      toast.error('ทำรายการไม่สำเร็จ')
    }
  }

  const clearAll = async () => {
    try {
      await fetch('/api/notifications', { method: 'DELETE' })
      setNotifications([])
      toast.success('ล้างการแจ้งเตือนแล้ว')
    } catch {
      toast.error('ทำรายการไม่สำเร็จ')
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl text-slate-700 dark:text-slate-300 transition-all duration-300 hover:scale-105 hover:bg-white/80 dark:hover:bg-white/[0.1]"
        aria-label="การแจ้งเตือน"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-lg animate-[pulse-glow_2s_ease-in-out_infinite]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-strong rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.2s_ease-out]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                การแจ้งเตือน
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={markAllRead}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title="อ่านทั้งหมด"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={clearAll}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="ล้างทั้งหมด"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-white/20 dark:border-t-white" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={
                      'p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ' +
                      (!n.read ? 'bg-blue-50/30 dark:bg-blue-500/[0.05]' : '')
                    }
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ' +
                          (n.type === 'success'
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                            : n.type === 'error'
                            ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                            : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400')
                        }
                      >
                        {n.type === 'success' ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : n.type === 'error' ? (
                          <XCircle className="h-3.5 w-3.5" />
                        ) : (
                          <Bell className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          {new Date(n.created_at).toLocaleString('th-TH', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-black/[0.06] dark:border-white/[0.06]">
            <Link
              href="/dashboard/settings?tab=telegram"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              ตั้งค่าการแจ้งเตือน Telegram
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}