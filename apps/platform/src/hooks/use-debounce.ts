import { useEffect, useRef } from 'react'

type Timer = ReturnType<typeof setTimeout>
type SomeFunction = (...args: unknown[]) => void

export function useDebounce<Func extends SomeFunction>(
  func: Func,
  delay = 500
) {
  const timer = useRef<Timer | null>(null) // <- important: explicit initial value

  const debouncedFunction = ((...args: Parameters<Func>) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      func(...(args as unknown[]))
    }, delay)
  }) as Func

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return debouncedFunction
}
