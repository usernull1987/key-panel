import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardNav } from '@/components/dashboard-nav'

// ✅ บังคับให้ layout นี้ render ที่ request time เท่านั้น (ไม่ prerender)
// เพราะต้องอ่าน cookie + verify JWT ซึ่งเป็น runtime data
export const instant = false

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      <DashboardNav username={session.username} />

      {/* Content — Navbar อยู่บนแล้ว ไม่ต้อง padding ซ้าย */}
      <main>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}