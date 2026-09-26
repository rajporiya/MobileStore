import { FiAlertTriangle } from 'react-icons/fi'
import AdminModal from './AdminModal'

/**
 * Destructive-action confirmation. Wired to the busy state so a double click
 * cannot fire two deletes.
 */
export default function AdminConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  danger = true,
  children,
}) {
  return (
    <AdminModal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={title}
      size="sm"
      closeOnBackdrop={!busy}
      footer={
        <>
          <button className="btn-secondary !px-4 !py-2 text-sm" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            className={danger ? 'btn-danger' : 'btn-primary !px-4 !py-2 text-sm'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            )}
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        {danger && (
          <span className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <FiAlertTriangle className="w-[18px] h-[18px]" />
          </span>
        )}
        <p className="text-sm text-slate-600 leading-relaxed pt-1.5">{message}</p>
      </div>
      {children}
    </AdminModal>
  )
}
