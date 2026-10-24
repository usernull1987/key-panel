'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  User, Mail, ShieldCheck, Calendar, Settings,
  Gem, Copy, Check, ExternalLink, Activity,
  Key, Cpu, Clock, ArrowRight, Zap
} from 'lucide-react'

interface AdminProfile {
  id: string
  username: string
  email: string
  image: string
  points: number
  role: string
  created_at: string
  // Mock stats (คุณสามารถดึงจาก API เพิ่มได้)
  stats?: {
    keys_created: number
    api_calls: number
  }
}

export default function AdminProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile', { cache: 'no-store' })
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        
        if (data.data.role !== 'admin') {
          toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้')
          router.push('/dashboard')
          return
        }

        setUser(data.data)
      } catch {
        toast.error('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [router])

  const copyId = () => {
    if (!user) return
    navigator.clipboard.writeText(user.id)
    setCopied(true)
    toast.success('คัดลอก User ID แล้ว')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!user) return null

  // Format Date (Joined)
  const joinedDate = new Date(user.created_at || Date.now()).toLocaleDateString('th-TH', {
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          โปรไฟล์แอดมิน
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          ข้อมูลบัญชีและสิทธิ์การใช้งานของคุณ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ═══════ ซ้าย: ข้อมูลหลัก ═══════ */}
        <div className="md:col-span-1 space-y-4">
          
          {/* Profile Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f0f] p-6 shadow-sm">
            {/* Background Accent */}
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-transparent dark:from-blue-500/20 dark:via-cyan-500/10" />
            
            <div className="relative flex flex-col items-center text-center mt-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-white dark:border-[#0f0f0f] shadow-xl">
                  <AvatarImage src={user.image} alt={user.username} />
                  <AvatarFallback className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-2xl font-bold">
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white dark:ring-[#0f0f0f]">
                  <ShieldCheck className="h-3.5 w-3.5 text-white" />
                </div>
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                {user.username}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {user.email}
              </p>
              
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                <ShieldCheck className="h-3 w-3" />
                {user.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : user.role}
              </div>
            </div>

            <div className="mt-6 space-y-3 pt-6 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> เข้าร่วมเมื่อ
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {joinedDate}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> สถานะ
                </span>
                <span className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  ออนไลน์
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f0f] p-4 shadow-sm">
            <Link href="/dashboard/settings" className="block">
              <Button variant="outline" className="w-full justify-between h-11 rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.05]">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Settings className="h-4 w-4" />
                  ตั้งค่าบัญชี
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Button>
            </Link>
          </div>
        </div>

        {/* ═══════ ขวา: สถิติและข้อมูล ═══════ */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Points Card */}
            <div className="rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/5 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                  <Gem className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Points ของคุณ
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                {user.points?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-1">
                ใช้สำหรับ Reset HWID หรืออัปเกรด
              </p>
            </div>

            {/* Role Stats Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f0f] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                  <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  สิทธิ์การใช้งาน
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                Full Access
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                เข้าถึงระบบได้ทุกส่วน
              </p>
            </div>
          </div>

          {/* Account Info Details */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f0f] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.04] flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                ข้อมูลบัญชี
              </h3>
            </div>
            <div className="p-6 space-y-5">
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">ชื่อผู้ใช้</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{user.username}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">อีเมล</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">User ID</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm font-mono text-slate-900 dark:text-white">{user.id}</p>
                      <button 
                        onClick={copyId}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        title="คัดลอก"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// Loader Component
function Loader2({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}