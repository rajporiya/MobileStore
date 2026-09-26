import { toneClass, titleCase } from '../../../utils/adminUtils'
import { cx } from '../adminTheme'

/**
 * The single badge used for every status in the admin panel, so a "delivered"
 * order, a "completed" trade-in and a "paid" payment always look the same.
 */
export default function AdminStatusBadge({ value, tone, label, dot = true, size = 'sm', className = '' }) {
  if (value === undefined || value === null || value === '') return null

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
  }

  return (
    <span
      className={cx(
        'inline-flex items-center whitespace-nowrap rounded font-semibold uppercase tracking-wide ring-1 ring-inset',
        sizes[size] || sizes.sm,
        toneClass(tone),
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {label || titleCase(value)}
    </span>
  )
}
