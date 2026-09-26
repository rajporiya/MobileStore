import { initials } from '../../../utils/adminUtils'
import { cx } from '../adminTheme'

/**
 * Identity chip for customers, dealers and admins. Flat neutral fill rather
 * than the storefront's gradient, so a column of avatars reads as data.
 */
export default function AdminAvatar({ name, src, size = 'md', ring = false, className = '' }) {
  const sizes = {
    xs: 'h-7 w-7 text-[10px]',
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
  }

  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 font-bold text-slate-600',
        sizes[size] || sizes.md,
        ring && 'ring-2 ring-white',
        className
      )}
    >
      {src ? (
        <img src={src} alt={name || 'User'} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        initials(name)
      )}
    </span>
  )
}
