import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { cx } from '../adminTheme'

/**
 * The one popover primitive in the admin panel: account menu, row actions,
 * filter menus and anything else that needs click-outside, Escape, alignment
 * and focus behaviour. Rendered in a portal so it is never clipped by a table's
 * horizontal scroll container.
 */
export default function AdminDropdown({
  trigger,
  children,
  align = 'right',
  width = 'w-56',
  className = '',
  open: controlledOpen,
  onOpenChange,
  header,
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = (next) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  const rootRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return
      if (panelRef.current?.contains(event.target)) return
      setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <div className="relative" ref={rootRef}>
      {trigger({ open, toggle: () => setOpen(!open), close: () => setOpen(false) })}

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            className={cx(
              'fixed z-[60] mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg',
              width,
              className
            )}
            style={align === 'right' ? { right: 8, top: panelTop(rootRef.current) } : { left: 8, top: panelTop(rootRef.current) }}
          >
            {header && <div className="border-b border-slate-100 px-3.5 py-3">{header}</div>}
            <div className="p-1">{children({ close: () => setOpen(false) })}</div>
          </div>,
          document.body
        )}
    </div>
  )
}

/** Viewport-aware vertical placement: flip above the trigger when it would overflow. */
function panelTop(triggerEl) {
  if (!triggerEl) return 0
  const rect = triggerEl.getBoundingClientRect()
  const below = rect.bottom + 4
  const panelHeight = Math.min(360, window.innerHeight - below - 12)
  return below + panelHeight > window.innerHeight - 8 ? Math.max(8, rect.top - panelHeight - 4) : below
}

/** Menu row used inside every AdminDropdown. */
export function AdminDropdownItem({ icon: Icon, label, onClick, danger = false, disabled = false, description }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'
      )}
    >
      {Icon && <Icon className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />}
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-[11px] text-slate-500">{description}</span>}
      </span>
    </button>
  )
}

/** Section divider inside a menu. */
export function AdminDropdownDivider() {
  return <div className="my-1 h-px bg-slate-100" role="separator" />
}

/** Small caption at the top of a menu group. */
export function AdminDropdownLabel({ children }) {
  return <p className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{children}</p>
}
