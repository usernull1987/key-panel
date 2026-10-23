export function DashboardSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Navbar skeleton */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-white/[0.06] bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
              <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        </div>
      </header>

      {/* Content skeleton */}
      <main>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 lg:py-8">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10 mb-6" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}