import { FiAlertCircle, FiLoader } from 'react-icons/fi'

/**
 * Inline spinner for a single pending action (a save button, a row toggle).
 * For a whole page use the skeletons in AdminSkeletons instead — a spinner in
 * an empty panel reads as a broken screen.
 */
export default function AdminLoading({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-6 text-[13px] text-slate-500 ${className}`} role="status">
      <FiLoader className="h-4 w-4 animate-spin text-indigo-600" aria-hidden="true" />
      {label}
    </div>
  )
}

/** Full-panel failure state for a page section that is not a table. */
export function AdminLoadError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center" role="alert">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
        <FiAlertCircle className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="text-[14px] font-semibold text-slate-800">Something went wrong</p>
      {message && <p className="mt-1 max-w-sm text-[12px] text-slate-500">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          Try again
        </button>
      )}
    </div>
  )
}
