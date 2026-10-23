'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Key, LayoutDashboard, Settings, LogOut, Menu, X, Shield,
  Terminal, Bell, Code,
} from 'lucide-react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationBell } from '@/components/notification-bell'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/keys', label: 'Keys', icon: Key },
  { href: '/dashboard/api-clients', label: 'API Clients', icon: Terminal },
  { href: '/dashboard/settings', label: 'API Docs', icon: Code },
]

export function DashboardNav({ username }: { username: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('ออกจากระบบ')
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <>
      {/* MAIN TOP NAVBAR */}
      <header className="sticky top-0 z-40 glass border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-3">

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30">
                <Key className="h-4 w-4 text-white" />
              </div>
              <span className="hidden sm:inline font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                Key Panel
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {NAV.map((item) => {
                const active = isActive(item.href, item.exact)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      'relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ' +
                      (active
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white')
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <ThemeToggle />
              <NotificationBell />

              <div className="hidden md:flex items-center gap-2 pl-2 ml-1 border-l border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
                  {username.substring(0, 2).toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  ออก
                </button>
              </div>

              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                aria-label="เปิดเมนู"
              >
                <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      <div
        className={
          'md:hidden fixed inset-0 z-50 ' +
          (mobileOpen ? 'pointer-events-auto' : 'pointer-events-none')
        }
      >
        <div
          className={
            'absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-md transition-opacity duration-300 ' +
            (mobileOpen ? 'opacity-100' : 'opacity-0')
          }
          onClick={() => setMobileOpen(false)}
        />

        <aside
          className={
            'absolute right-0 top-0 h-full w-72 max-w-[85vw] glass-strong border-l flex flex-col transition-transform duration-300 ease-out rounded-l-3xl ' +
            (mobileOpen ? 'translate-x-0' : 'translate-x-full')
          }
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
                <Key className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Key Panel</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Admin</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              เมนู
            </p>
            <div className="space-y-1">
              {NAV.map((item, i) => {
                const active = isActive(item.href, item.exact)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ' +
                      (active
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]')
                    }
                    style={{
                      transitionDelay: mobileOpen ? i * 50 + 'ms' : '0ms',
                      opacity: mobileOpen ? 1 : 0,
                      transform: mobileOpen ? 'translateX(0)' : 'translateX(8px)',
                      transitionProperty: 'opacity, transform, background-color',
                      transitionDuration: '300ms',
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] px-3 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
                {username.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                  {username}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5" />
                  Administrator
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}