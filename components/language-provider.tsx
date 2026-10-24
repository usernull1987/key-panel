'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Locale, translations, Translation } from '@/lib/i18n'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translation
}

const defaultContext: LanguageContextType = {
  locale: 'th',
  setLocale: () => {},
  t: translations.th,
}

const LanguageContext = createContext<LanguageContextType>(defaultContext)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('th')

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null
    if (saved === 'th' || saved === 'en') {
      setLocaleState(saved)
    } else {
      const browserLang = navigator.language.toLowerCase()
      setLocaleState(browserLang.startsWith('th') ? 'th' : 'en')
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
    document.documentElement.lang = newLocale
  }

  const t: Translation = locale === 'en' ? translations.en : translations.th

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}