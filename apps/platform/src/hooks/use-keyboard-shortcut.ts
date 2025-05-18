import { useCallback, useEffect, useState } from 'react'

interface KeyboardShortcutOptions {
  key: string
  ctrl?: boolean
  meta?: boolean
  initialState?: boolean
}
/**
 * Custom React hook to handle keyboard shortcuts with optional Ctrl and Meta key modifiers.
 *
 * @param key - The key to listen for (e.g., 'k', 'Enter').
 * @param ctrl - Whether the Ctrl key must be pressed (default: true).
 * @param meta - Whether the Meta (Command/Windows) key must be pressed (default: true).
 * @param initialState - The initial active state of the shortcut (default: false).
 * @returns A tuple containing:
 *   - `isActive`: A boolean indicating whether the shortcut is currently active.
 *   - `toggle`: A function to manually toggle the active state.
 *
 * @example
 * ```ts
 * const [isActive, toggle] = useKeyboardShortcut({ key: 'k', ctrl: true, meta: true });
 * ```
 */
export function useKeyboardShortcut({
  key,
  ctrl = true,
  meta = true,
  initialState = false
}: KeyboardShortcutOptions): [boolean, () => void] {
  const [isActive, setIsActive] = useState<boolean>(initialState)

  const toggle = useCallback(() => {
    setIsActive((prev) => !prev)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      // Check if either meta key (for Mac) or ctrl key (for Windows/Linux) is pressed
      const modifierActive = (meta && e.metaKey) || (ctrl && e.ctrlKey)

      if (e.key === key && modifierActive) {
        e.preventDefault()
        toggle()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [key, ctrl, meta, toggle])

  return [isActive, toggle]
}
