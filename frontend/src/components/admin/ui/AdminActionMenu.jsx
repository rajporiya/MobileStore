import { useState } from 'react'
import { FiMoreVertical } from 'react-icons/fi'

import AdminDropdown, { AdminDropdownItem } from './AdminDropdown'
import { cx } from '../adminTheme'

/**
 * Row actions menu. A thin wrapper over AdminDropdown so every table row uses
 * the same popover behaviour and the same look.
 */
export default function AdminActionMenu({ items, label = 'Row actions', align = 'right', className = '' }) {
  const [open, setOpen] = useState(false)

  return (
    <AdminDropdown
      width="w-48"
      open={open}
      onOpenChange={setOpen}
      trigger={({ toggle, open: isOpen }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className={cx(
            'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
            isOpen ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
            className
          )}
        >
          <FiMoreVertical className="h-4 w-4" />
        </button>
      )}
    >
      {({ close }) =>
        items
          .filter((item) => !item.hidden)
          .map((item) => (
            <AdminDropdownItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              description={item.description}
              danger={item.danger}
              disabled={item.disabled}
              onClick={() => {
                close()
                item.onClick?.()
              }}
            />
          ))
      }
    </AdminDropdown>
  )
}
