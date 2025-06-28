import { useAtomValue } from 'jotai'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { CheckmarkSVG, CopySVG } from '@public/svg/shared'
import { userAtom } from '@/store'

function ReferralCodeShare() {
  const user = useAtomValue(userAtom)
  const [copied, setCopied] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode)
      setCopied(true)

      toast.success('Referral code copied!', {
        description: (
          <p className="text-xs text-green-300">
            Your referral code has been copied to clipboard.
          </p>
        )
      })

      setTimeout(() => setCopied(false), 4500)
    }
  }

  if (!user?.referralCode) {
    return null
  }

  return (
    <div className=" w-full max-w-md">
      {/* Header Section */}
      <div className="mb-3 flex flex-col gap-2 ">
        <h2 className="text-xl font-semibold">Invite Others to Keyshade</h2>
        <p className="text-sm text-white/60">
          Share your unique referral code to invite others to join Keyshade
        </p>
      </div>

      {/* Referral Code Section */}
      <div className="rounded-xl border border-white/10  p-6 backdrop-blur-sm">
        <h3 className="mb-3 text-lg font-semibold text-white">
          Your Referral Code
        </h3>

        {/* Copy Button */}
        <div className=" group relative flex w-full items-center justify-between gap-3 rounded-lg border border-white/20 bg-white/5 p-4 font-mono transition-all duration-200 hover:bg-white/10 hover:shadow-lg hover:shadow-white/5">
          <div className="flex-1 overflow-hidden">
            <p
              className="font-mono text-base font-medium tracking-wider text-white"
              ref={textRef}
            >
              {user.referralCode}
            </p>
          </div>

          <button
            className="ml-3 flex-shrink-0"
            onClick={copyReferralCode}
            type="button"
          >
            <div
              className={`rounded-lg p-2 transition-all duration-200 ${
                copied
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/10 text-white/70 group-hover:bg-white/20 group-hover:text-white'
              }`}
            >
              {copied ? (
                <CheckmarkSVG className="h-5 w-5" />
              ) : (
                <CopySVG className="h-5 w-5" />
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReferralCodeShare
