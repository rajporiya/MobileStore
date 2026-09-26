import { AdminTableSkeleton } from './AdminSkeletons'
import { AdminEmptyState, AdminErrorState } from './AdminEmptyState'
import { cx } from '../adminTheme'

/**
 * The one table shell used across the admin panel.
 *
 * It owns the loading, error and empty branches so no page re-implements them,
 * keeps the horizontal scroll wrapper that makes a wide table usable on a
 * phone, and supports an optional leading checkbox column for bulk selection.
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
  skeletonRows = 8,
  rowKey = (row) => row._id,
  footer,
  selectable = false,
  selectedIds = [],
  onToggleRow,
  onToggleAll,
  allSelected = false,
  stickyHeader = true,
  minWidth = 'min-w-[720px]',
}) {
  const colCount = columns.length + (selectable ? 1 : 0)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="overflow-x-auto">
        <table className={cx('w-full text-[13px]', minWidth)}>
          <thead className={cx('bg-slate-50/80', stickyHeader && 'sticky top-0 z-10')}>
            <tr>
              {selectable && (
                <th scope="col" className="w-10 border-b border-slate-200 px-4 py-2.5 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => onToggleAll?.()}
                    aria-label="Select all rows"
                    className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key || column.label}
                  scope="col"
                  className={cx(
                    'border-b border-slate-200 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider',
                    'text-slate-500 whitespace-nowrap',
                    column.className
                  )}
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
                  <AdminEmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="divide-y divide-slate-100">
              {children(rowKey, selectedIds, onToggleRow)}
            </tbody>
          )}
        </table>
      </div>

      {footer && !loading && !error && !isEmpty && (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {footer}
        </div>
      )}
    </div>
  )
}

/** Shared cell wrapper so column padding never drifts between tables. */
export function Td({ className = '', children, ...rest }) {
  return (
    <td className={cx('px-4 py-3 align-middle text-[13px] text-slate-600', className)} {...rest}>
      {children}
    </td>
  )
}

export const thClass = 'border-b border-slate-200 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap'
