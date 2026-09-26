import { useEffect, useRef, useState } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'
import useDebounce from '../../../hooks/useDebounce'

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
    <div className={`relative ${className}`}>
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl
          text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400
          focus:ring-2 focus:ring-slate-900/5"
      />
      {text && (
        <button
          type="button"
          onClick={() => setText('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400
            hover:text-slate-700 hover:bg-slate-100"
        >
          <FiX className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
