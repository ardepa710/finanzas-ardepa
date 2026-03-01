export default function InsightsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-2 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-700 rounded-full" />
            <div className="h-4 bg-slate-700 rounded w-48" />
          </div>
          <div className="h-3 bg-slate-700 rounded w-full" />
          <div className="h-3 bg-slate-700 rounded w-3/4" />
        </div>
      ))}
    </div>
  )
}
