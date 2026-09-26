import { NavLink } from 'react-router-dom'
import { FiChevronsLeft, FiChevronsRight, FiX } from 'react-icons/fi'

import { ADMIN_NAV, ADMIN_ACCOUNT_NAV, isNavActive } from './adminNav'
import { cx } from './adminTheme'

const WIDTH = { expanded: 'w-60', collapsed: 'w-[72px]' }

/** Small VoltCart mark — a bolt inside a rounded tile, matching the storefront. */
function AdminLogo({ collapsed }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" fill="currentColor" className="text-white" />
      </svg>
    </span>
  )
}

/**
 * Floating label shown while the sidebar is collapsed. A native `title` is not
 * used: it cannot be styled and disappears before the pointer arrives.
 */
function NavTooltip({ label }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full z-50 ml-2.5 whitespace-nowrap rounded-md border border-slate-700
        bg-slate-900 px-2.5 py-1.5 text-[12px] font-semibold text-white opacity-0 shadow-lg
        transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  )
}

function NavItems({ collapsed, onNavigate }) {
  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-4">
      {ADMIN_NAV.map((group, groupIndex) => (
        <div key={group.section} className={groupIndex === 0 ? '' : 'mt-5'}>
          {collapsed ? (
            <div className="mx-2 mb-2.5 h-px bg-slate-800" />
          ) : (
            <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              {group.section}
            </p>
          )}

          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cx(
                      'group relative flex items-center rounded-lg text-[13px] font-medium transition-colors duration-150',
                      collapsed ? 'justify-center px-2 py-2' : 'gap-3 px-2.5 py-2',
                      // Legacy aliases must light the renamed item up too, so the
                      // active state is derived rather than taken from NavLink.
                      isActive || isNavActive(item, window.location.pathname)
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                    )
                  }
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {collapsed && <NavTooltip label={item.label} />}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function AccountBlock({ collapsed, onLogout, onNavigate }) {
  return (
    <div className="border-t border-slate-800 p-2.5">
      <ul className="space-y-0.5">
        {ADMIN_ACCOUNT_NAV.map((item) => {
          if (item.action === 'logout') {
            return (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={onLogout}
                  title={collapsed ? item.label : undefined}
                  className={cx(
                    'group relative flex w-full items-center rounded-lg text-[13px] font-medium text-slate-400',
                    'transition-colors duration-150 hover:bg-red-500/10 hover:text-red-400',
                    collapsed ? 'justify-center px-2 py-2' : 'gap-3 px-2.5 py-2'
                  )}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                  {collapsed && <NavTooltip label={item.label} />}
                </button>
              </li>
            )
          }

          return (
            <li key={item.label}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={cx(
                  'group relative flex items-center rounded-lg text-[13px] font-medium text-slate-400',
                  'transition-colors duration-150 hover:bg-slate-800/80 hover:text-slate-100',
                  collapsed ? 'justify-center px-2 py-2' : 'gap-3 px-2.5 py-2'
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
                {collapsed && <NavTooltip label={item.label} />}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function CollapseButton({ collapsed, onToggle, className }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      className={cx(
        'flex items-center rounded-lg py-2 text-[13px] font-medium text-slate-400 transition-colors',
        'hover:bg-slate-800/80 hover:text-slate-100',
        collapsed ? 'justify-center px-2' : 'gap-3 px-2.5',
        className
      )}
    >
      {collapsed ? <FiChevronsRight className="h-4 w-4" /> : <FiChevronsLeft className="h-4 w-4" />}
      {!collapsed && <span>Collapse</span>}
    </button>
  )
}

/**
 * The dark navigation rail. Rendered twice: once as a fixed desktop sidebar
 * and once inside the mobile drawer, so both surfaces stay identical without
 * duplicating the item list.
 */
export default function AdminSidebar({ collapsed, onToggleCollapse, onLogout, onNavigate, variant = 'desktop' }) {
  const isDrawer = variant === 'drawer'

  return (
    <div
      className={cx(
        'flex h-full flex-col bg-[#0f172a] text-slate-200',
        isDrawer ? 'w-72 max-w-[85vw]' : cx('fixed inset-y-0 left-0 z-30 transition-[width] duration-200', collapsed ? WIDTH.collapsed : WIDTH.expanded)
      )}
    >
      <div
        className={cx(
          'flex h-16 shrink-0 items-center border-b border-slate-800',
          collapsed && !isDrawer ? 'justify-center px-2' : 'gap-2.5 px-4'
        )}
      >
        <AdminLogo collapsed={collapsed} />
        {(!collapsed || isDrawer) && (
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold leading-tight text-white">VoltCart</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Admin Panel</p>
          </div>
        )}
        {isDrawer && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close navigation"
            className="ml-auto rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>

      <NavItems collapsed={collapsed && !isDrawer} onNavigate={onNavigate} />

      <div className={cx('border-t border-slate-800', collapsed && !isDrawer ? 'px-2.5 py-2' : 'px-2.5 py-2')}>
        {!isDrawer && <CollapseButton collapsed={collapsed} onToggle={onToggleCollapse} className="w-full" />}
        {isDrawer && (
          <CollapseButton collapsed={false} onToggle={() => {}} className="w-full cursor-default opacity-0 pointer-events-none" />
        )}
      </div>

      <AccountBlock collapsed={collapsed && !isDrawer} onLogout={onLogout} onNavigate={onNavigate} />
    </div>
  )
}
