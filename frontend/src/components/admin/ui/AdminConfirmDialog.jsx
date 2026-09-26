import { FiAlertTriangle } from 'react-icons/fi'

import AdminModal from './AdminModal'
import { ADMIN_BUTTONS } from '../adminTheme'

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
          <button type="button" className={ADMIN_BUTTONS.secondary} onClick={onClose} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className={danger ? ADMIN_BUTTONS.danger : ADMIN_BUTTONS.primary} onClick={onConfirm} disabled={busy}>
            {busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        {danger && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <FiAlertTriangle className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
        )}
        <p className="pt-1.5 text-[13px] leading-relaxed text-slate-600">{message}</p>
      </div>
      {children}
    </AdminModal>
  )
}
