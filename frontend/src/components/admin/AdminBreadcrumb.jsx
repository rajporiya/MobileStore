import { Link } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'

import { cx } from './adminTheme'

/**
 * `Home / Catalog / Products` trail for the topbar. Accepts either a ready-made
 * array or a single label (which becomes the only crumb).
 */
export default function AdminBreadcrumb({ items, className = '' }) {
  const crumbs = Array.isArray(items) ? items.filter(Boolean) : items ? [{ label: items }] : []

  if (crumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={cx('flex items-center gap-1 text-[12px]', className)}>
      <Link to="/admin" className="font-medium text-slate-500 transition-colors hover:text-slate-800">
        Home
      </Link>

      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1
        return (
          <span key={crumb.label} className="flex min-w-0 items-center gap-1">
            <FiChevronRight className="h-3 w-3 shrink-0 text-slate-300" aria-hidden="true" />
            {crumb.to && !isLast ? (
              <Link to={crumb.to} className="truncate font-medium text-slate-500 transition-colors hover:text-slate-800">
                {crumb.label}
              </Link>
            ) : (
              <span className={cx('truncate', isLast ? 'font-semibold text-slate-800' : 'font-medium text-slate-500')}>
                {crumb.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
