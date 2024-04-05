'use client'
import { GeistSans } from 'geist/font/sans'
import { KeyshadeBigSVG } from '@public/svg/auth'
import { Button } from '@/components/ui/button'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot
} from '@/components/ui/input-otp'

export default function AuthOTPPage(): React.JSX.Element {
  return (
    <main className="flex h-screen items-center justify-center justify-items-center px-4">
      <div className="flex flex-col gap-6">
        <div className="mb-14 flex flex-col items-center">
          <KeyshadeBigSVG />
          <h1 className={`${GeistSans.className} text-[2.5rem] font-semibold`}>
            Welcome to Keyshade
          </h1>
        </div>

        <div className="flex flex-col gap-3">
          <InputOTP maxLength={6}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <Button className="w-full">Get Started</Button>
        </div>
        <Button className="w-full" variant="outline">
          Already have an account? Sign In
        </Button>
        <div className="text-center text-xs text-[#808080]">
          By continueing, you acknowledge and agree to our <br />
          Legal Terms and Privacy Policy.
        </div>
      </div>
    </main>
  )
}
