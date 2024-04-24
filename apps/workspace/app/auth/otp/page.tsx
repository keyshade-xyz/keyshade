'use client'
import { KeyshadeBigSVG } from '@public/svg/auth'
import { GeistSansFont } from '@/fonts'
import { Button } from '@/components/ui/button'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot
} from '@/components/ui/input-otp'

export default function AuthOTPPage(): React.JSX.Element {
  return (
    <main className="flex h-dvh items-center justify-center justify-items-center px-4">
      <div className="flex flex-col gap-6">
        <div className="mb-14 flex flex-col items-center">
          <KeyshadeBigSVG />
          <h1
            className={`${GeistSansFont.className} text-center text-[2rem] font-semibold md:text-[2.5rem]`}
          >
            Verify your mail address
          </h1>
          <div
            className={`${GeistSansFont.className} flex flex-col items-center`}
          >
            <span>We&apos;ve sent a verification code to </span>
            <span>abc@gmail.com</span>
          </div>
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

          <Button className="w-full">Verify</Button>
        </div>
      </div>
    </main>
  )
}
