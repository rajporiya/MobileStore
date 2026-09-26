import { initials } from '../../../utils/adminUtils'

/** Consistent identity chip for customers, dealers and admins. */
export default function AdminAvatar({ name, src, size = 'md', ring = false }) {
  const sizes = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  }

  return (
    <span
      className={`${sizes[size] || sizes.md} shrink-0 rounded-full overflow-hidden bg-gradient-to-br
        from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center
        ${ring ? 'ring-2 ring-white shadow-sm' : ''}`}
    >
      {src ? (
        <img src={src} alt={name || 'User'} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        initials(name)
      )}
    </span>
  )
}
