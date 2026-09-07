export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="bg-cream-200 aspect-square" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-cream-200 rounded w-16" />
        <div className="h-4 bg-cream-200 rounded w-full" />
        <div className="h-4 bg-cream-200 rounded w-3/4" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 w-3 bg-cream-200 rounded" />
          ))}
        </div>
        <div className="h-5 bg-cream-200 rounded w-24" />
        <div className="h-9 bg-cream-200 rounded-xl" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="animate-pulse">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 py-3 border-b border-cream-100">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="h-4 bg-cream-200 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-cream-300 border-t-brown rounded-full animate-spin" />
        <p className="text-stone-500 text-sm">Loading...</p>
      </div>
    </div>
  )
}
