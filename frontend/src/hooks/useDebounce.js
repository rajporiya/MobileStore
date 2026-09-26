import { useEffect, useState } from 'react'

/**
 * Debounces a fast-changing value (search boxes) so the admin list is not
 * re-queried on every keystroke.
 */
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
