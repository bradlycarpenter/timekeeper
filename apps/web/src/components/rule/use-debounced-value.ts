import { useEffect, useState } from 'react'

/** Rule fields change by select, not by keystroke, but a request fired on
 * every select-change would still storm the board while the user clicks
 * through options; this holds the previous value until changes stop. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timeout)
  }, [value, delayMs])

  return debounced
}
