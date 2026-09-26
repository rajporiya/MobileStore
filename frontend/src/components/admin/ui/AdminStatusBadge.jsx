import { toneClass, titleCase } from '../../../utils/adminUtils'

/**
 * The single badge used for every status in the admin panel, so a "delivered"
 * order, a "completed" trade-in and a "paid" payment always look the same.
 */
export default function AdminStatusBadge({ value, tone, label, dot = true, className = '' }) {
  if (value === undefined || value === null || value === '') return null

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold
        ring-1 ring-inset whitespace-nowrap ${toneClass(tone)} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {label || titleCase(value)}
    </span>
  )
}
