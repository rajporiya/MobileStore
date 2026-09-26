import { Link } from 'react-router-dom'

const TONES = {
  indigo: 'bg-indigo-50 text-indigo-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  sky: 'bg-sky-50 text-sky-600',
  violet: 'bg-violet-50 text-violet-600',
  slate: 'bg-slate-100 text-slate-600',
}

const DELTAS = {
  up: 'text-emerald-600 bg-emerald-50',
  down: 'text-red-600 bg-red-50',
  flat: 'text-slate-500 bg-slate-100',
}

/**
 * Dashboard metric tile. `delta` is only rendered when the caller has real
 * data to compare against — no invented percentage. `hint` is plain context
 * text such as "3 active" under the number.
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'indigo',
  delta,
  deltaLabel,
  hint,
  onClick,
  to,
}) {
  const className = `w-full text-left bg-white rounded-2xl border border-slate-200 p-5 shadow-sm
    ${onClick || to ? 'hover:border-slate-300 hover:shadow-card-hover cursor-pointer transition-all' : ''}`

  const body = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1.5 truncate">{value}</p>
        {hint && !delta && <p className="text-[11px] text-slate-400 mt-1.5 truncate">{hint}</p>}
        {delta !== undefined && delta !== null && (
          <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[11px] font-bold ${DELTAS[delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat']}`}>
            {delta > 0 ? '▲' : delta < 0 ? '▼' : '■'} {Math.abs(delta)}
            {deltaLabel && <span className="font-medium opacity-70">{deltaLabel}</span>}
          </span>
        )}
      </div>
      {Icon && (
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TONES[tone] || TONES.indigo}`}>
          <Icon className="w-[18px] h-[18px]" />
        </span>
      )}
    </div>
  )

  // A real `to` navigates client-side; a plain anchor would reload the app.
  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    )
  }

  return <div className={className}>{body}</div>
}
