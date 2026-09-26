import { FiAlertCircle, FiInbox } from 'react-icons/fi'

/** Shown when a list request succeeded but there is nothing to display. */
export function AdminEmptyState({ icon: Icon = FiInbox, title = 'Nothing here yet', description, action }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Shown when a list request failed, with a retry that re-runs the same call. */
export function AdminErrorState({ message = 'We could not load this list.', onRetry }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
        <FiAlertCircle className="w-5 h-5" />
      </div>
      <p className="text-sm font-semibold text-slate-700">Something went wrong</p>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary !py-2 !px-4 text-xs mt-5">
          Try again
        </button>
      )}
    </div>
  )
}

export default AdminEmptyState
