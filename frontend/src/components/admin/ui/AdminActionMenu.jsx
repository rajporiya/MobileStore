import { useEffect, useRef, useState } from 'react'
import { FiMoreVertical } from 'react-icons/fi'

/**
 * Small click-outside dropdown for row actions. Closes on Escape, on outside
 * click and after an action is picked.
 */
export default function AdminActionMenu({ items, label = 'Row actions', align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const onClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <FiMoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-30 mt-1 w-44 rounded-xl bg-white border border-slate-200 shadow-lg py-1
            ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false)
                item.onClick?.()
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
                ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
