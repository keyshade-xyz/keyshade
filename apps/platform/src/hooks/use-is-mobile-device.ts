import { useCallback, useEffect, useState } from 'react'

/**
 * Determine if the current device is a mobile device.
 *
 * @returns Returns true if the device is a mobile device, false otherwise.
 */
export function useIsMobileDevice(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  const MOBILE_BREAKPOINT = 768

  const checkMobile = useCallback(() => {
    // Check if device supports touch
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0
    const minViewportDimension = Math.min(window.innerWidth, window.innerHeight)
    const isSmallDevice = minViewportDimension <= MOBILE_BREAKPOINT

    const isMobileDevice = isTouchDevice && isSmallDevice

    setIsMobile(isMobileDevice)
  }, [])

  useEffect(() => {
    checkMobile()

    window.addEventListener('resize', checkMobile)

    screen.orientation.addEventListener('change', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
      screen.orientation.removeEventListener('change', checkMobile)
    }
  }, [checkMobile])

  return isMobile
}
