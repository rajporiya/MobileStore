import { useMemo, useRef, useState } from 'react'
import { shortMoney, money } from '../../../utils/adminUtils'

const W = 720
const H = 240
const PAD = { top: 16, right: 16, bottom: 28, left: 54 }

/**
 * Rounds an axis maximum up to a readable 1 / 2 / 5 x 10^n step, so gridline
 * labels are never arbitrary numbers like 1374.
 */
function niceCeiling(value) {
  if (!value || value <= 0) return 10
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalised = value / magnitude
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10
  return step * magnitude
}

const useNearest = (coords, WIDTH) => {
  const ref = useRef(null)
  const [index, setIndex] = useState(null)

  const onMove = (event) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect || coords.length === 0) return
    const x = ((event.clientX - rect.left) / rect.width) * WIDTH
    let nearest = 0
    let best = Infinity
    coords.forEach((point, i) => {
      const distance = Math.abs(point.x - x)
      if (distance < best) {
        best = distance
        nearest = i
      }
    })
    setIndex(nearest)
  }

  return { ref, index, handlers: { onMouseMove: onMove, onMouseLeave: () => setIndex(null) } }
}

/**
 * Smooth trend area with a hover crosshair.
 *
 * Hand-rolled SVG rather than a charting dependency: the panel stays one
 * bundle lighter and the colours are the admin design tokens instead of a
 * library theme.
 */
export function AdminAreaChart({
  data = [],
  valueKey = 'revenue',
  labelKey = 'label',
  formatValue = money,
  formatAxis = shortMoney,
  color = '#4f46e5',
  height = 'h-60',
  emptyMessage = 'No data in this period.',
  ariaLabel = 'Trend chart',
}) {
  const points = useMemo(
    () => data.map((item, index) => ({ ...item, value: Number(item[valueKey] || 0), label: item[labelKey], i: index })),
    [data, valueKey, labelKey]
  )

  const chart = useMemo(() => {
    if (points.length === 0) return null

    const max = niceCeiling(Math.max(...points.map((p) => p.value), 1))
    const innerW = W - PAD.left - PAD.right
    const innerH = H - PAD.top - PAD.bottom
    const stepX = points.length > 1 ? innerW / (points.length - 1) : 0

    const coords = points.map((point, index) => ({
      ...point,
      x: PAD.left + (points.length > 1 ? stepX * index : innerW / 2),
      y: PAD.top + innerH - (point.value / max) * innerH,
    }))

    const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
    const baseline = PAD.top + innerH
    const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${baseline} L${coords[0].x.toFixed(1)},${baseline} Z`

    const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ f, y: PAD.top + innerH - f * innerH }))
    const labelEvery = Math.max(1, Math.ceil(coords.length / 7))
    // 30+ daily points is more shape than detail, so a 2px dot per point turns
    // the line into noise.
    const showDots = coords.length <= 14

    return { coords, line, area, max, grid, labelEvery, showDots, baseline, innerH }
  }, [points])

  const hover = useNearest(chart?.coords || [], W)

  if (!chart) {
    return (
      <div className={`${height} flex items-center justify-center text-[13px] text-slate-400`}>
        {emptyMessage}
      </div>
    )
  }

  const { coords, line, area, max, grid, labelEvery, showDots, baseline } = chart
  const active = hover.index === null ? null : coords[hover.index]
  const gradientId = `adminArea-${color.replace('#', '')}`

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={`w-full ${height}`}
        role="img"
        aria-label={ariaLabel}
        preserveAspectRatio="none"
        {...hover.handlers}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {grid.map(({ f, y }) => (
          <g key={f}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray={f === 0 ? '0' : '3 4'} />
            <text x={PAD.left - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8" className="tabular-nums">
              {formatAxis(max * f)}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

        {showDots &&
          coords.map((c, i) => (
            <circle key={c.i} cx={c.x} cy={c.y} r="2.5" fill={color} className="pointer-events-none" />
          ))}

        {coords.map((c, i) =>
          i % labelEvery === 0 ? (
            <text key={`l-${c.i}`} x={c.x} y={H - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
              {c.label}
            </text>
          ) : null
        )}

        {active && (
          <g className="pointer-events-none">
            <line x1={active.x} x2={active.x} y1={PAD.top} y2={baseline} stroke={color} strokeOpacity="0.3" />
            <circle cx={active.x} cy={active.y} r="4.5" fill={color} stroke="#fff" strokeWidth="2" />
          </g>
        )}

        <rect ref={hover.ref} x="0" y="0" width={W} height={H} fill="transparent" />
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute top-2 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white shadow-lg"
          style={{ left: `${(active.x / W) * 100}%` }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{active.label}</p>
          <p className="text-[13px] font-bold tabular-nums">{formatValue(active.value)}</p>
        </div>
      )}
    </div>
  )
}

/**
 * Vertical bars, used where a count per bucket is the story (orders placed,
 * sign-ups) rather than a continuous value.
 */
export function AdminBarChart({
  data = [],
  valueKey = 'value',
  labelKey = 'label',
  color = '#4f46e5',
  formatValue = (v) => v,
  height = 'h-60',
  emptyMessage = 'No data in this period.',
  ariaLabel = 'Bar chart',
}) {
  const points = useMemo(
    () => data.map((item, index) => ({ ...item, value: Number(item[valueKey] || 0), label: item[labelKey], i: index })),
    [data, valueKey, labelKey]
  )

  const [hover, setHover] = useState(null)

  const chart = useMemo(() => {
    if (points.length === 0) return null
    const max = niceCeiling(Math.max(...points.map((p) => p.value), 1))
    const innerW = W - PAD.left - PAD.right
    const innerH = H - PAD.top - PAD.bottom
    const slot = innerW / points.length
    const barW = Math.max(3, Math.min(26, slot * 0.62))
    const baseline = PAD.top + innerH

    const coords = points.map((point, index) => ({
      ...point,
      x: PAD.left + slot * index + (slot - barW) / 2,
      y: PAD.top + innerH - (point.value / max) * innerH,
      w: barW,
      h: Math.max(point.value > 0 ? 2 : 0, (point.value / max) * innerH),
    }))

    const grid = [0, 0.5, 1].map((f) => ({ f, y: PAD.top + innerH - f * innerH }))
    const labelEvery = Math.max(1, Math.ceil(coords.length / 7))

    return { coords, max, grid, labelEvery, baseline }
  }, [points])

  if (!chart) {
    return (
      <div className={`${height} flex items-center justify-center text-[13px] text-slate-400`}>
        {emptyMessage}
      </div>
    )
  }

  const { coords, max, grid, labelEvery, baseline } = chart
  const active = hover === null ? null : coords[hover]

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className={`w-full ${height}`} role="img" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
        {grid.map(({ f, y }) => (
          <g key={f}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray={f === 0 ? '0' : '3 4'} />
            <text x={PAD.left - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8" className="tabular-nums">
              {formatValue(max * f)}
            </text>
          </g>
        ))}

        {coords.map((c, i) => (
          <g key={c.i} onMouseEnter={() => setHover(i)} className="cursor-default">
            <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="2" fill={color} opacity={hover === null || hover === i ? 1 : 0.45} />
            {i % labelEvery === 0 && (
              <text x={c.x + c.w / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
                {c.label}
              </text>
            )}
          </g>
        ))}

        <line x1={PAD.left} x2={W - PAD.right} y1={baseline} y2={baseline} stroke="#e2e8f0" />
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute top-2 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white shadow-lg"
          style={{ left: `${((active.x + active.w / 2) / W) * 100}%` }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{active.label}</p>
          <p className="text-[13px] font-bold tabular-nums">{formatValue(active.value)}</p>
        </div>
      )}
    </div>
  )
}

/**
 * Compact donut for a status split, with the total in the middle. A doughnut
 * beats a pie at this size because the centre carries the number that matters.
 */
export function AdminDonutChart({ data = [], total, size = 168, thickness = 22, centerLabel, ariaLabel = 'Breakdown chart' }) {
  const [hover, setHover] = useState(null)

  const slices = useMemo(() => {
    const rows = data.filter((row) => Number(row.value) > 0)
    const sum = rows.reduce((acc, row) => acc + Number(row.value), 0)
    if (sum === 0) return { rows: [], sum: 0, arcs: [] }

    const radius = (size - thickness) / 2
    const circumference = 2 * Math.PI * radius
    let offset = 0

    const arcs = rows.map((row) => {
      const fraction = Number(row.value) / sum
      const arc = {
        ...row,
        dash: fraction * circumference,
        offset,
        percent: Math.round(fraction * 100),
      }
      offset += fraction * circumference
      return arc
    })

    return { rows, sum, arcs, radius, circumference }
  }, [data, size, thickness])

  if (slices.sum === 0) {
    return (
      <div className="flex items-center justify-center text-[13px] text-slate-400" style={{ height: size }}>
        Nothing to show yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={ariaLabel} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={slices.radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={thickness}
          />
          {slices.arcs.map((arc, i) => (
            <circle
              key={arc.label || i}
              cx={size / 2}
              cy={size / 2}
              r={slices.radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={hover === null || hover === i ? thickness : thickness - 5}
              strokeDasharray={`${arc.dash} ${slices.circumference - arc.dash}`}
              strokeDashoffset={-arc.offset}
              className="cursor-default transition-all duration-200"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {hover !== null ? (
            <>
              <span className="text-xl font-bold tabular-nums text-slate-900">{slices.arcs[hover].percent}%</span>
              <span className="max-w-[80px] truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {slices.arcs[hover].label}
              </span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold tabular-nums text-slate-900">{total ?? slices.sum}</span>
              {centerLabel && <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{centerLabel}</span>}
            </>
          )}
        </div>
      </div>

      <ul className="space-y-1.5">
        {slices.arcs.map((arc, i) => (
          <li
            key={arc.label || i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className="flex items-center gap-2 text-[13px]"
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: arc.color }} />
            <span className="font-medium text-slate-700">{arc.label}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums text-slate-900">{arc.value}</span>
            <span className="w-9 text-right text-xs tabular-nums text-slate-400">{arc.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Tiny trend line for a stat card. No axes, no labels — shape only. */
export function AdminSparkline({ data = [], valueKey = 'value', color = '#4f46e5', width = 96, height = 32 }) {
  const points = useMemo(() => {
    const values = data.map((item) => Number(item[valueKey] || 0))
    if (values.length < 2) return null
    const max = Math.max(...values)
    const min = Math.min(...values)
    const span = max - min || 1
    const step = width / (values.length - 1)

    const coords = values.map((value, index) => ({
      x: step * index,
      y: height - 2 - ((value - min) / span) * (height - 4),
    }))

    return {
      line: coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' '),
      last: coords[coords.length - 1],
    }
  }, [data, valueKey, width, height])

  if (!points) return null

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="overflow-visible">
      <path d={points.line} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <circle cx={points.last.x} cy={points.last.y} r="2.5" fill={color} />
    </svg>
  )
}

export default AdminAreaChart
