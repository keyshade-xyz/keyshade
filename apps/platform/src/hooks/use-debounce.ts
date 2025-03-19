import { useRef, useEffect } from "react";

type Timer = ReturnType<typeof setTimeout>
type SomeFunction = (...args: unknown[]) => void

export function useDebounce<Func extends SomeFunction>(
    func: Func,
    delay = 500
) {
    const timer = useRef<Timer>()

    const debouncedFunction = ((...args) => {
        clearTimeout(timer.current)
        timer.current = setTimeout(() => {
            func(...args)
        }, delay)
    }) as Func

    useEffect(() => {
        return () => {
            if (timer.current) {
                clearTimeout(timer.current)
            }
        }
    }, [])

    return debouncedFunction
}