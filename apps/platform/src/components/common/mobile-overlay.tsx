'use client'

import { LogoSVG } from '@public/svg/dashboard'
import { MobileScreenSVG } from '@public/svg/shared'
import { useEffect, useState } from 'react'

export default function MobileOverlay() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      // Check if device supports touch
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const smallerDimension = Math.min(window.innerWidth, window.innerHeight);
      const isSmallDevice = smallerDimension <= 768;
      
      const isMobileDevice = isTouchDevice && isSmallDevice;
      
      setIsMobile(isMobileDevice);
    }

    checkMobile();

    window.addEventListener('resize', checkMobile);
    
    screen.orientation.addEventListener('change', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      screen.orientation.removeEventListener('change', checkMobile);
    };
  }, []);

  // Do not render overlay during initial render to avoid hydration mismatch
  if (typeof window === 'undefined') {
    return null;
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
  
  return null;
}