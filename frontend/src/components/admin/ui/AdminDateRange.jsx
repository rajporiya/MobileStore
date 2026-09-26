/** From/to date range used by orders, payments and trade-ins. */
export default function AdminDateRange({ label = 'Date range', from, to, onChange, className = '' }) {
  return (
    <div className={className}>
      {label && <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</span>}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={from || ''}
          max={to || undefined}
          onChange={(e) => onChange({ from: e.target.value, to })}
          aria-label="From date"
          className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-700
            focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
        />
        <span className="text-slate-300 text-xs">to</span>
        <input
          type="date"
          value={to || ''}
          min={from || undefined}
          onChange={(e) => onChange({ from, to: e.target.value })}
          aria-label="To date"
          className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-700
            focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
        />
      </div>
    </div>
  )
}
