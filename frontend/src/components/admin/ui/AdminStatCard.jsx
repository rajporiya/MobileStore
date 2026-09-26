import { Link } from 'react-router-dom'
import { FiArrowDownRight, FiArrowUpRight, FiMinus } from 'react-icons/fi'

import { AdminSparkline } from './AdminCharts'
import { cx } from '../adminTheme'

const ICON_TONES = {
  indigo: 'bg-indigo-50 text-indigo-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  sky: 'bg-sky-50 text-sky-600',
  violet: 'bg-violet-50 text-violet-600',
  slate: 'bg-slate-100 text-slate-600',
}

const SPARK_COLORS = {
  indigo: '#4f46e5',
  green: '#059669',
  amber: '#d97706',
  red: '#dc2626',
  sky: '#0284c7',
  violet: '#7c3aed',
  slate: '#64748b',
}

/**
 * Dashboard metric tile.
 *
 * `delta` is only rendered when the caller passes a real comparison — the
 * percentage comes from the backend's previous-period aggregate, never from a
 * hard-coded figure. `spark` takes the same series the charts use, so the tile
 * shows shape without adding another request.
 */
export default function AdminStatCard({
  label,
  value,
  icon: Icon,
  tone = 'indigo',
  delta,
  deltaLabel,
  hint,
  spark,
  sparkValueKey = 'revenue',
  onClick,
  to,
  className = '',
}) {
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  const DeltaIcon = direction === 'up' ? FiArrowUpRight : direction === 'down' ? FiArrowDownRight : FiMinus
  const deltaTone =
    direction === 'up' ? 'bg-emerald-50 text-emerald-700' : direction === 'down' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'

  const clickable = Boolean(onClick || to)
  const shell = cx(
    'group relative flex w-full items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left',
    'shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-150',
    clickable && 'cursor-pointer hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)]',
    className
  )

  const body = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1.5 truncate text-[22px] font-bold leading-none tracking-tight text-slate-900 tabular-nums">{value}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {delta !== undefined && delta !== null && (
            <span className={cx('inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums', deltaTone)}>
              <DeltaIcon className="h-3 w-3" />
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {(deltaLabel || hint) && <span className="truncate text-[11px] text-slate-500">{deltaLabel || hint}</span>}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {Icon && (
          <span className={cx('flex h-9 w-9 items-center justify-center rounded-lg', ICON_TONES[tone] || ICON_TONES.indigo)}>
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
        )}
        {spark?.length > 1 && (
          <span className="hidden sm:block">
            <AdminSparkline data={spark} valueKey={sparkValueKey} color={SPARK_COLORS[tone] || SPARK_COLORS.indigo} />
          </span>
        )}
      </div>
    </>
  )

  // A real `to` navigates client-side; a plain anchor would reload the app.
  if (to) {
    return (
      <Link to={to} className={shell}>
        {body}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shell}>
        {body}
      </button>
    )
  }

  return <div className={shell}>{body}</div>
}
