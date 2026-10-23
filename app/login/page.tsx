'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { toast } from 'sonner'
import { Shield, Eye, EyeOff, Loader2, Key } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.message || 'เข้าสู่ระบบไม่สำเร็จ')
        return
      }
      toast.success('ยินดีต้อนรับ')
      router.replace('/dashboard')
      router.refresh()
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-blue-500/20 dark:bg-blue-500/30 blur-[100px] animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-purple-500/20 dark:bg-purple-500/30 blur-[100px] animate-[float_10s_ease-in-out_infinite_reverse]" />
      </div>

      {/* Theme toggle - top right */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm animate-[slideUp_0.5s_ease-out]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 blur-xl opacity-60" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <Key className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Key Panel
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Admin / Developer only
          </p>
        </div>

        {/* Glass card */}
        <div className="glass-strong rounded-3xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Username หรือ Email
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="input-glass"
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-glass pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </Button>
          </form>
        </div>

        <div className="mt-8 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 justify-center">
          <Shield className="h-3 w-3" />
          Protected admin area
        </div>
      </div>
    </div>
  )
}