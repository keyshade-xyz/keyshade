'use client'

import { LogoSVG } from '@public/svg/dashboard'
import { MobileScreenSVG } from '@public/svg/shared'
import { useIsMobileDevice } from '@/hooks/use-is-mobile-device'

export default function MobileOverlay() {
  const isMobile = useIsMobileDevice()

  // Do not render overlay during initial render to avoid hydration mismatch
  if (typeof window === 'undefined') {
    return null
  }

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0E0E0E]">
        <LogoSVG className="mb-8" />
        <MobileScreenSVG className="text-gray-400" />
        <div className="px-4 text-center">
          <p className="text-lg">
            Please log-in through <br /> desktop to use Keyshade.
          </p>
        </div>
      </div>
    )
  }

  return null
}
