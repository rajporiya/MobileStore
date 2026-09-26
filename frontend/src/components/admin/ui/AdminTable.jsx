import { AdminTableSkeleton } from './AdminSkeletons'
import { AdminEmptyState, AdminErrorState } from './AdminEmptyState'

/**
 * The one table shell used across the admin panel. It owns the loading, error
 * and empty branches so no page has to re-implement them, and keeps the
 * horizontal scroll wrapper that makes wide tables usable on a phone.
 */
export default function AdminTable({
  columns,
  children,
  loading = false,
  error = null,
  isEmpty = false,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  onRetry,
  skeletonRows = 6,
  rowKey = (row) => row._id,
  rowClassName,
  footer,
}) {
  const colCount = columns.length

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key || column.label}
                  scope="col"
                  className={`text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${
                    column.className || ''
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          {loading ? (
            <AdminTableSkeleton rows={skeletonRows} cols={colCount} />
          ) : error ? (
            <tbody>
              <tr>
                <td colSpan={colCount}>
                  <AdminErrorState message={error} onRetry={onRetry} />
                </td>
              </tr>
            </tbody>
          ) : isEmpty ? (
            <tbody>
              <tr>
                <td colSpan={colCount}>
                  <AdminEmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="divide-y divide-slate-100">
              {children(rowKey)}
            </tbody>
          )}
        </table>
      </div>

      {footer && !loading && !error && !isEmpty && (
        <div className="px-4 py-3 border-t border-slate-200">{footer}</div>
      )}
    </div>
  )
}
