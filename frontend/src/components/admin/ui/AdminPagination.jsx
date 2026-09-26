import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

import { cx } from '../adminTheme'

/** Windowed pager shared by every admin list, with a live result count. */
export default function AdminPagination({ page, pages, total, onChange, itemLabel = 'records' }) {
  if (!pages || pages < 1) return null

  const SPAN = 1
  const from = Math.max(1, page - SPAN)
  const to = Math.min(pages, page + SPAN)
  const numbers = []
  for (let i = from; i <= to; i += 1) numbers.push(i)

  const buttonBase =
    'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[12px] font-semibold tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-40'
  const idle = 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-900'

  return (
    <>
      <p className="text-[12px] text-slate-500">
        {total > 0 ? (
          <>
            <span className="font-semibold text-slate-700 tabular-nums">{total}</span> {itemLabel}
          </>
        ) : (
          'No results'
        )}
      </p>

      {pages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            className={cx(buttonBase, idle)}
            aria-label="Previous page"
          >
            <FiChevronLeft className="h-3.5 w-3.5" />
          </button>

          {from > 1 && (
            <>
              <button type="button" onClick={() => onChange(1)} className={cx(buttonBase, idle)}>
                1
              </button>
              {from > 2 && <span className="px-1 text-[12px] text-slate-400">…</span>}
            </>
          )}

          {numbers.map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => onChange(number)}
              aria-current={number === page ? 'page' : undefined}
              className={cx(
                buttonBase,
                number === page ? 'bg-indigo-600 text-white shadow-sm' : idle
              )}
            >
              {number}
            </button>
          ))}

          {to < pages && (
            <>
              {to < pages - 1 && <span className="px-1 text-[12px] text-slate-400">…</span>}
              <button type="button" onClick={() => onChange(pages)} className={cx(buttonBase, idle)}>
                {pages}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onChange(page + 1)}
            disabled={page >= pages}
            className={cx(buttonBase, idle)}
            aria-label="Next page"
          >
            <FiChevronRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      )}
    </>
  )
}
