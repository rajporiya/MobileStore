import { FiRotateCcw } from 'react-icons/fi'
import { cx } from '../adminTheme'

/**
 * Filter container for every admin list. Collapses to a single scrollable row on
 * a phone so the toolbar never grows taller than the data it describes.
 */
export default function AdminTableToolbar({ children, onReset, isFiltered = false, resultCount, resultLabel = 'matching', className = '' }) {
  return (
    <section
      className={cx('rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]', className)}
    >
      <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-end lg:gap-3">{children}</div>

      {onReset && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-3 py-2">
          <p className="text-[12px] text-slate-500">
            {isFiltered ? (
              <>
                Filters applied
                {resultCount !== undefined && (
                  <>
                    {' · '}
                    <span className="font-semibold text-slate-700 tabular-nums">{resultCount}</span> {resultLabel}
                  </>
                )}
              </>
            ) : (
              'No filters applied'
            )}
          </p>
          <button
            type="button"
            onClick={onReset}
            disabled={!isFiltered}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiRotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      )}
    </section>
  )
}
