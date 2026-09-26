/** Page title + description + right-aligned actions, used on every admin page. */
export default function AdminPageHeader({ title, description, icon: Icon, actions, breadcrumb }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Icon className="w-[18px] h-[18px]" />
          </span>
        )}
        <div className="min-w-0">
          {breadcrumb}
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">{title}</h1>
          {description && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </div>
  )
}
