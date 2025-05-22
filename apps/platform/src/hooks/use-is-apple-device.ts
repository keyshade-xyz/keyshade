import { useState, useEffect } from 'react'

/**
 * Hook to detect if the user is using an Apple device
 * @returns true if user is on an Apple device
 */
export function useIsAppleDevice(): { isApple: boolean } {
  const [isApple, setIsApple] = useState<boolean>(false)

  useEffect(() => {
    // Check if the user is using an Apple device
    const userAgent = window.navigator.userAgent
    setIsApple(userAgent.includes('Mac OS X'))
  }, [])

  return { isApple }
}
