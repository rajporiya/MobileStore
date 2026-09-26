import { cx } from '../adminTheme'

/** Row placeholder so a loading table keeps its real column widths. */
export function AdminTableSkeleton({ rows = 8, cols = 5 }) {
  return (
    <tbody className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: cols }).map((__, colIndex) => (
            <td key={colIndex} className="px-4 py-3.5">
              <div
                className="h-3 animate-pulse rounded bg-slate-100"
                style={{ width: `${45 + ((rowIndex * 7 + colIndex * 13) % 45)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

/** Card placeholder for the dashboard stat grid. */
export function AdminCardSkeleton({ count = 4, className = '' }) {
  return (
    <div className={cx('grid grid-cols-2 gap-4 xl:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2.5">
              <div className="h-2.5 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-6 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-2.5 w-28 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Panel/chart placeholder. */
export function AdminPanelSkeleton({ className = 'h-64' }) {
  return <div className={cx('animate-pulse rounded-xl bg-slate-100', className)} />
}

/**
 * The dashboard skeleton: the whole first screen, shaped like the real page, so
 * the layout does not jump when the data lands.
 */
export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-3.5 w-72 animate-pulse rounded bg-slate-100" />
      </div>

      <AdminCardSkeleton count={4} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <AdminPanelSkeleton className="h-[352px] xl:col-span-2" />
        <AdminPanelSkeleton className="h-[352px]" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AdminPanelSkeleton className="h-72" />
        <AdminPanelSkeleton className="h-72" />
      </div>
    </div>
  )
}

/** Form placeholder for create/edit screens. */
export function AdminFormSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="space-y-1.5">
          <div className="h-2.5 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-9 w-full animate-pulse rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

/** Feed placeholder for detail-page activity lists. */
export function AdminListSkeleton({ rows = 5 }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-slate-100" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/5 animate-pulse rounded bg-slate-100" />
            <div className="h-2.5 w-3/5 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Alias kept so pre-redesign pages keep resolving. */
export const AdminStatSkeleton = AdminCardSkeleton

export default AdminTableSkeleton
