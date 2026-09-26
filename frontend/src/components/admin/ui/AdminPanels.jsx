/** Bordered panel with an optional header, used for every detail and feed block. */
export function SectionCard({ title, subtitle, action, children, className = '', bodyClassName = 'p-5' }) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-bold text-slate-900 truncate">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

/** Label/value pair for detail pages, with optional wide/full variants. */
export function DataRow({ label, value, icon: Icon, wide = false, mono = false }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </dt>
      <dd className={`text-sm text-slate-800 font-medium mt-1 break-words ${mono ? 'font-mono text-[13px]' : ''}`}>
        {value ?? '—'}
      </dd>
    </div>
  )
}

export function DataGrid({ children, cols = 2 }) {
  return <dl className={`grid grid-cols-1 ${cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>{children}</dl>
}

/** One line inside an activity feed or summary list. */
export function ListRow({ icon: Icon, title, subtitle, trailing, to, onClick }) {
  const Wrapper = to ? 'a' : onClick ? 'button' : 'div'
  const props = to ? { href: to } : onClick ? { onClick, type: 'button' } : {}

  return (
    <Wrapper
      {...props}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
        ${to || onClick ? 'hover:bg-slate-50 cursor-pointer' : ''}`}
    >
      {Icon && (
        <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </span>
      )}
      <div className="min-w-0 grow">
        <p className="text-sm font-semibold text-slate-800 truncate">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
      </div>
      {trailing && <div className="shrink-0 text-right">{trailing}</div>}
    </Wrapper>
  )
}

export default SectionCard
