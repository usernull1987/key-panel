export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 h-16 border-b border-slate-200 dark:border-white/[0.06] bg-white/90 dark:bg-[#0a0a0a]/90" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 lg:py-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10 mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  )
}