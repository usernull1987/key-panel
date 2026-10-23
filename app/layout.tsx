import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { ConfirmProvider } from '@/hooks/use-confirm'
import { LanguageProvider } from '@/components/language-provider'

const lineSeed = localFont({
  src: '../public/fonts/LINESeedSansTH_W_Rg.woff',
  variable: '--font-line-seed',
  display: 'swap',
  weight: '400',
})

export const metadata: Metadata = {
  title: 'Key Panel - Admin',
  description: 'License Key Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className={lineSeed.variable} suppressHydrationWarning>
      <body className={lineSeed.className + ' antialiased min-h-screen'}>
        <ThemeProvider>
          <LanguageProvider>
            <ConfirmProvider>
              {children}
            </ConfirmProvider>
          </LanguageProvider>
          <Toaster position="top-right" richColors theme="system" />
        </ThemeProvider>
      </body>
    </html>
  )
}