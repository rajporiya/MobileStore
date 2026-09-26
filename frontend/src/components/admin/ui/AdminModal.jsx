import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { FiX } from 'react-icons/fi'

import { cx } from '../adminTheme'

/**
 * Dialog shell used by every admin overlay: backdrop click, Escape to close,
 * body scroll lock and initial focus. Each feature page therefore does not have
 * to reimplement modal behaviour.
 */
export default function AdminModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cx(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-xl',
          widths[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-bold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 truncate text-[12px] text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1.5 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="grow overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  )
}
