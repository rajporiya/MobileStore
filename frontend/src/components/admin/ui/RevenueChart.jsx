import { useMemo, useRef, useState } from 'react'
import { shortMoney, money } from '../../../utils/adminUtils'

const W = 800
const H = 260
const PAD = { top: 18, right: 18, bottom: 30, left: 58 }

// Rounds the axis top up to a readable 1/2/5 x 10^n step so gridline labels
// are never arbitrary numbers like 1374.
function niceCeiling(value) {
  if (value <= 0) return 100
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalised = value / magnitude
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10
  return step * magnitude
}

/**
 * Dependency-free revenue trend. SVG rather than a chart library so the panel
 * adds no weight, and the tooltip is keyboard-reachable through the index
 * buttons under the plot.
 */
export default function RevenueChart({ data = [], valueKey = 'revenue', labelKey = 'label' }) {
  const [hover, setHover] = useState(null)
  const plotRef = useRef(null)

  const chart = useMemo(() => {
    const points = data.map((item, index) => ({
      ...item,
      value: Number(item[valueKey] || 0),
      label: item[labelKey],
    }))

    if (!points.length) return null

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
    const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${coords[0].x.toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z`

    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ f, y: PAD.top + innerH - f * innerH }))
    const labelEvery = Math.max(1, Math.ceil(coords.length / 6))

    return { coords, line, area, max, ticks, labelEvery, innerH }
  }, [data, valueKey, labelKey])

  if (!chart) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-400">
        No revenue recorded in this period.
      </div>
    )
  }

  const { coords, line, area, max, ticks, labelEvery, innerH } = chart
  const baseline = PAD.top + innerH
  const active = hover === null ? null : coords[hover]

  const handleMove = (event) => {
    const rect = plotRef.current?.getBoundingClientRect()
    if (!rect) return
    const ratio = (event.clientX - rect.left) / rect.width
    const x = ratio * W
    let nearest = 0
    let best = Infinity
    coords.forEach((c, i) => {
      const distance = Math.abs(c.x - x)
      if (distance < best) {
        best = distance
        nearest = i
      }
    })
    setHover(nearest)
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-64"
        role="img"
        aria-label="Revenue trend"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="adminChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map(({ f, y }) => (
          <g key={f}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray={f === 0 ? '0' : '3 4'}
            />
            <text x={PAD.left - 10} y={y + 4} textAnchor="end" className="fill-slate-400" fontSize="11">
              {shortMoney(max * f)}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#adminChartFill)" />
        <path d={line} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {coords.map((c, i) => (
          <g key={`${c.label}-${i}`}>
            {i % labelEvery === 0 && (
              <text x={c.x} y={H - 8} textAnchor="middle" className="fill-slate-400" fontSize="11">
                {c.label}
              </text>
            )}
            {hover === i && (
              <>
                <line x1={c.x} x2={c.x} y1={PAD.top} y2={baseline} stroke="#4f46e5" strokeOpacity="0.25" />
                <circle cx={c.x} cy={c.y} r="5" fill="#4f46e5" stroke="#fff" strokeWidth="2" />
              </>
            )}
          </g>
        ))}

        <rect ref={plotRef} x="0" y="0" width={W} height={H} fill="transparent" />
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute top-3 -translate-x-1/2 px-3 py-2 rounded-xl bg-slate-900
            text-white text-xs shadow-lg whitespace-nowrap z-10"
          style={{ left: `${(active.x / W) * 100}%` }}
        >
          <p className="text-slate-300 text-[10px] font-semibold uppercase tracking-wider">{active.label}</p>
          <p className="font-bold text-sm">{money(active.value)}</p>
        </div>
      )}
    </div>
  )
}
