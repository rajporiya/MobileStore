/** Row-shaped placeholder so a loading table keeps its real column widths. */
export function AdminTableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <tbody className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-3.5 bg-slate-100 rounded animate-pulse" style={{ width: `${45 + ((i * 7 + j * 13) % 45)}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

/** Card-shaped placeholder for the dashboard stat grid. */
export function AdminStatSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2.5">
              <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
              <div className="h-7 w-24 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Block placeholder for chart and feed panels. */
export function AdminPanelSkeleton({ className = 'h-64' }) {
  return <div className={`${className} bg-slate-100 rounded-2xl animate-pulse`} />
}

export default AdminTableSkeleton
