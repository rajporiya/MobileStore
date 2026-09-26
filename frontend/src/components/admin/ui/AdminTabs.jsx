import { cx } from '../adminTheme'

/**
 * Horizontal tab strip for the settings and detail pages. On a phone it becomes
 * a scrollable row so the tab labels never wrap into a second row of buttons.
 */
export default function AdminTabs({ tabs = [], value, onChange, className = '' }) {
  return (
    <div className={cx('overflow-x-auto border-b border-slate-200', className)}>
      <nav className="flex min-w-max gap-1" role="tablist">
        {tabs.map((tab) => {
          const active = tab.id === value
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={cx(
                'relative flex items-center gap-2 whitespace-nowrap px-3.5 py-2.5 text-[13px] font-semibold transition-colors',
                active ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {tab.icon && <tab.icon className="h-4 w-4" aria-hidden="true" />}
              {tab.label}
              {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-indigo-600" aria-hidden="true" />}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
