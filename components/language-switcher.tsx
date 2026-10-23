'use client'

import { useEffect, useRef, useState } from 'react'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { Locale } from '@/lib/i18n'

const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const current = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 items-center gap-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl px-2.5 text-slate-700 dark:text-slate-300 transition-all duration-300 hover:scale-105 hover:bg-white/80 dark:hover:bg-white/[0.1]"
        aria-label="Change language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{current.flag}</span>
        <ChevronDown
          className={
            'h-3 w-3 text-slate-400 transition-transform duration-200 ' +
            (open ? 'rotate-180' : '')
          }
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 glass-strong rounded-xl shadow-2xl overflow-hidden animate-[scaleIn_0.15s_ease-out] z-50">
          {LANGUAGES.map((lang) => {
            const active = lang.code === locale
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setLocale(lang.code)
                  setOpen(false)
                }}
                className={
                  'w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ' +
                  (active
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]')
                }
              >
                <span className="text-base">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.label}</span>
                {active && <Check className="h-3.5 w-3.5" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}