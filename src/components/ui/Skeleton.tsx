interface SkeletonProps {
  variant?: 'card' | 'table-row' | 'text' | 'circle'
  className?: string
  lines?: number
}

export default function Skeleton({ variant = 'text', className = '', lines = 1 }: SkeletonProps) {
  if (variant === 'card') {
    return (
      <div className={`bg-slate-800 rounded-xl p-4 space-y-3 animate-pulse ${className}`}>
        <div className="h-4 bg-slate-700 rounded w-1/3" />
        <div className="h-8 bg-slate-700 rounded w-1/2" />
        <div className="h-3 bg-slate-700 rounded w-2/3" />
      </div>
    )
  }
  if (variant === 'table-row') {
    return (
      <div className={`flex gap-3 py-3 animate-pulse ${className}`}>
        <div className="h-4 bg-slate-700 rounded w-1/4" />
        <div className="h-4 bg-slate-700 rounded flex-1" />
        <div className="h-4 bg-slate-700 rounded w-20" />
      </div>
    )
  }
  if (variant === 'circle') {
    return <div className={`rounded-full bg-slate-700 animate-pulse ${className}`} />
  }
  return (
    <div className={`space-y-2 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-slate-700 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  )
}
