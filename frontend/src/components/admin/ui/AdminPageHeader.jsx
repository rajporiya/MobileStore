import { cx } from '../adminTheme'

/**
 * Page title + description + right-aligned actions. `eyebrow` is the small
 * uppercase kicker above the title; the breadcrumb normally lives in the topbar
 * so it is not repeated here.
 */
export default function AdminPageHeader({ title, description, eyebrow, actions, meta, className = '' }) {
  return (
    <header className={cx('mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">{eyebrow}</p>}
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900 sm:text-[26px]">{title}</h1>
        {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
