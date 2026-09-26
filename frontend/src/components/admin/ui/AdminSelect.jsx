import { FiChevronDown } from 'react-icons/fi'
import { titleCase } from '../../../utils/adminUtils'

/**
 * Labelled select used by every filter bar. Options may be plain strings (the
 * backend enum value) or { value, label } when a friendlier word is wanted.
 */
export default function AdminSelect({
  label,
  value,
  onChange,
  options,
  className = '',
  allLabel = 'All',
  showAll = true,
}) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</span>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="w-full appearance-none pl-3 pr-9 py-2.5 text-sm bg-white border border-slate-200
            rounded-xl text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-2
            focus:ring-slate-900/5 cursor-pointer"
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
        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      </div>
    </label>
  )
}
