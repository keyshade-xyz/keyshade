import { LogoSVG } from '@public/svg/dashboard'
import { MobileScreenSVG } from '@public/svg/shared'

export default function MobileOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0E0E0E] pb-[160px] md:hidden">
      <LogoSVG className="mb-8" />
      <MobileScreenSVG className="text-gray-400" />
      <p className="px-4 text-center">
        Please log-in through <br /> desktop to use Keyshade.
      </p>
    </div>
  )
}
