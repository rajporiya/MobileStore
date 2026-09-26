import { FiAlertCircle, FiInbox } from 'react-icons/fi'
import { cx } from '../adminTheme'

/** Shown when a request succeeded but there is nothing to display. */
export function AdminEmptyState({ icon: Icon = FiInbox, title = 'Nothing here yet', description, action, compact = false }) {
  return (
    <div className={cx('px-6 text-center', compact ? 'py-8' : 'py-14')}>
      <span className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="text-[14px] font-semibold text-slate-800">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Shown when a request failed, with a retry that re-runs the same call. */
export function AdminErrorState({ message = 'We could not load this data.', onRetry, compact = false }) {
  return (
    <div className={cx('px-6 text-center', compact ? 'py-8' : 'py-14')}>
      <span className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
        <FiAlertCircle className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="text-[14px] font-semibold text-slate-800">Something went wrong</p>
      <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-slate-500">{message}</p>
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

export default AdminEmptyState
