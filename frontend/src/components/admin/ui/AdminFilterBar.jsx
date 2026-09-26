import { FiRotateCcw } from 'react-icons/fi'

/**
 * Responsive filter container. Collapses to a scrollable row on a phone so the
 * list header never grows taller than the data it describes.
 */
export default function AdminFilterBar({ children, onReset, isFiltered = false, resultCount }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">{children}</div>

      {(isFiltered || onReset) && (
        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            {isFiltered ? (
              <>
                Filters applied
                {resultCount !== undefined && (
                  <>
                    {' '}
                    · <span className="font-semibold text-slate-700">{resultCount}</span> matching
                  </>
                )}
              </>
            ) : (
              'No filters applied'
            )}
          </p>
          {onReset && (
            <button onClick={onReset} className="btn-ghost !py-1.5 !px-3 text-xs">
              <FiRotateCcw className="w-3.5 h-3.5" />
              Reset filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
