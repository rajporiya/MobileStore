import { ADMIN_LABEL } from '../adminTheme'

/** From/to date range used by orders, payments and trade-ins. */
export default function AdminDateRange({ label = 'Date range', from, to, onChange, className = '' }) {
  return (
    <div className={className}>
      {label && <span className={`${ADMIN_LABEL} mb-1.5 block`}>{label}</span>}
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={from || ''}
          max={to || undefined}
          onChange={(event) => onChange({ from: event.target.value, to })}
          aria-label="From date"
          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[13px] text-slate-700 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <span className="text-[11px] font-semibold text-slate-400">to</span>
        <input
          type="date"
          value={to || ''}
          min={from || undefined}
          onChange={(event) => onChange({ from, to: event.target.value })}
          aria-label="To date"
          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[13px] text-slate-700 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
    </div>
  )
}
