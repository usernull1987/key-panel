'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Key, LayoutDashboard, Settings, LogOut, Menu, X, Shield,
  Terminal, Code, User, ChevronDown, Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationBell } from '@/components/notification-bell'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false)
        setUserMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

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

              {/* User Dropdown (Desktop) */}
              <div className="hidden md:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className={`
                    flex items-center gap-2 rounded-full border py-1 pl-1 pr-2.5
                    transition-all duration-200
                    ${userMenuOpen
                      ? 'border-slate-300 dark:border-white/25 bg-slate-50 dark:bg-white/[0.08]'
                      : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/20'}
                  `}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[10px] font-bold text-white shadow-sm">
                    {username.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline max-w-[100px] truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                    {username}
                  </span>
                  <ChevronDown
                    className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown Menu */}
                <div
                  className={`
                    absolute right-0 mt-2 w-56 origin-top-right rounded-xl
                    border border-slate-200 dark:border-white/[0.08]
                    bg-white dark:bg-[#0f0f0f]
                    shadow-xl shadow-slate-900/5 dark:shadow-black/50
                    transition-all duration-150 ease-out overflow-hidden
                    ${userMenuOpen
                      ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                      : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'}
                  `}
                >
                  <div className="px-3 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {username}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                      <Shield className="h-2.5 w-2.5" />
                      Administrator
                    </p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <User className="h-4 w-4 text-slate-400" /> โปรไฟล์ของฉัน
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <Settings className="h-4 w-4 text-slate-400" /> ตั้งค่าบัญชี
                    </Link>
                    <div className="h-px bg-slate-100 dark:bg-white/[0.06] my-1" />
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> ออกจากระบบ
                    </button>
                  </div>
                </div>
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
            <Link
              href="/dashboard/profile"
              onClick={() => setMobileOpen(false)}
              className="mb-2 flex items-center gap-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] px-3 py-2.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
                {username.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                  {username}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5" />
                  Administrator
                </p>
              </div>
              <Sparkles className="h-3 w-3 text-slate-400" />
            </Link>
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