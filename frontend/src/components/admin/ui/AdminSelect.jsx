import { FiChevronDown } from 'react-icons/fi'
import { titleCase } from '../../../utils/adminUtils'
import { cx } from '../adminTheme'

/**
 * Labelled select used by every filter bar. Options may be plain strings (the
 * backend enum value) or `{ value, label }` when a friendlier word is wanted.
 */
export default function AdminSelect({
  label,
  value,
  onChange,
  options,
  className = '',
  allLabel = 'All',
  showAll = true,
  ...rest
}) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>}
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-[13px] text-slate-700 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          {...rest}
        >
          {showAll && <option value="">{allLabel}</option>}
          {options.map((option) => {
            const optionValue = typeof option === 'string' ? option : option.value
            const optionLabel = typeof option === 'string' ? titleCase(option) : option.label
            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            )
          })}
        </select>
        <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      </span>
    </label>
  )
}
