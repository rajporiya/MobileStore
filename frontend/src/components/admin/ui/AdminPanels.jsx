import { Link } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'

import { cx } from '../adminTheme'

/** Bordered panel with an optional header, used for every detail and feed block. */
export function SectionCard({ title, subtitle, action, children, className = '', bodyClassName = 'p-4 sm:p-5' }) {
  return (
    <section className={cx('rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="truncate text-[15px] font-bold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 truncate text-[12px] text-slate-500">{subtitle}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

/** "View all" link used in every panel header. */
export function ViewAllLink({ to, children = 'View all' }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
    >
      {children}
      <FiArrowRight className="h-3 w-3" />
    </Link>
  )
}

/** Label/value pair for detail pages. */
export function DataRow({ label, value, icon: Icon, wide = false, mono = false, href }) {
  const body = (
    <dd className={cx('mt-0.5 break-words text-[13px] font-medium text-slate-800', mono && 'font-mono text-[12px]')}>
      {value ?? '—'}
    </dd>
  )

  return (
    <div className={cx(wide && 'sm:col-span-2')}>
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
        {label}
      </dt>
      {href ? (
        <dd className="mt-0.5">
          <Link to={href} className="break-words text-[13px] font-medium text-indigo-600 hover:underline">
            {value}
          </Link>
        </dd>
      ) : (
        body
      )}
    </div>
  )
}

export function DataGrid({ children, cols = 2 }) {
  return (
    <dl className={cx('grid grid-cols-1 gap-x-4 gap-y-3.5', cols === 3 ? 'sm:grid-cols-3' : cols === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-2')}>
      {children}
    </dl>
  )
}

/** One line inside an activity feed or summary list. */
export function ListRow({ icon: Icon, title, subtitle, trailing, to, onClick }) {
  const content = (
    <>
      {Icon && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-slate-800">{title}</p>
        {subtitle && <p className="truncate text-[12px] text-slate-500">{subtitle}</p>}
      </div>
      {trailing && <div className="shrink-0 text-right">{trailing}</div>}
    </>
  )

  const shell = cx('flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50')

  if (to) {
    return (
      <Link to={to} className={shell}>
        {content}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shell}>
        {content}
      </button>
    )
  }
  return <div className={shell}>{content}</div>
}

export default SectionCard
