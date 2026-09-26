import { useEffect, useRef, useState } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'

import useDebounce from '../../../hooks/useDebounce'
import { cx } from '../adminTheme'

/**
 * Debounced search box. Local state keeps typing responsive while the list is
 * only re-queried once the user pauses.
 */
export default function AdminSearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
  delay = 400,
  label,
}) {
  const [text, setText] = useState(value || '')
  const debounced = useDebounce(text, delay)

  // What the parent was last told, so a parent-driven reset does not bounce the
  // stale debounced value back out and re-run the old query.
  const sent = useRef(value || '')

  useEffect(() => {
    if ((value || '') !== text) {
      setText(value || '')
      sent.current = value || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    if (debounced === sent.current) return
    sent.current = debounced
    onChange(debounced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  return (
    <label className={cx('block', className)}>
      {label && <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>}
      <span className="relative block">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={placeholder}
          aria-label={label || placeholder}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-8 text-[13px] text-slate-800 placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        {text && (
          <button
            type="button"
            onClick={() => setText('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <FiX className="h-3.5 w-3.5" />
          </button>
        )}
      </span>
    </label>
  )
}
