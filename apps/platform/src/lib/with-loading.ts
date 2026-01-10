/**
 * Sets the loading state to `true` before executing the provided function,
 * and resets it to `false` after execution, regardless of whether an error occurs.
 *
 * @param fn - The function to execute while loading.
 * @param setLoading - A function to update the loading state.
 * @returns A new function that manages the loading state around `fn`.
 */
export const withLoading = (fn: () => void, setLoading: (loading: boolean) => void) => {
  return () => {
    setLoading(true)
    try {
      fn()
    } finally {
      setLoading(false)
    }
  }
}