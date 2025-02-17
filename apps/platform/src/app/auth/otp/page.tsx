'use client'
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import { LoadingSVG } from '@public/svg/shared'
import { KeyshadeBigSVG } from '@public/svg/auth'
import { GeistSansFont } from '@/fonts'
import { Button } from '@/components/ui/button'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot
} from '@/components/ui/input-otp'
import { userAtom } from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'

export default function AuthOTPPage(): React.JSX.Element {
  const [user, setUser] = useAtom(userAtom)

  const [otp, setOtp] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isLoadingRefresh, setIsLoadingRefresh] = useState<boolean>(false)

  const router = useRouter()

  const validateOTP = useHttp(() => {
    if (user?.email) {
      return ControllerInstance.getInstance().authController.validateOTP({
        email: user.email,
        otp
      })
    }
    throw new Error('User not set in context')
  }, router)

  const resendOtp = useHttp(() => {
    if (user?.email) {
      return ControllerInstance.getInstance().authController.resendOTP({
        userEmail: user.email
      })
    }
    throw new Error('User not set in context')
  }, router)

  useEffect(() => {
    if (!user?.email) {
      router.push('/auth')
    }
  }, [router, user?.email])

  const handleVerifyOTP = async (): Promise<void> => {
    if (!user) {
      throw new Error('User not set in context')
    }

    const emailResult = z.string().email().safeParse(user.email)
    const alphanumeric = z
      .string()
      .length(6)
      .refine((value) => /^[a-z0-9]+$/i.test(value), {
        message: 'OTP must be alphanumeric'
      })
    const otpResult = alphanumeric.safeParse(otp)

    if (!emailResult.success || !otpResult.success) {
      toast.warning('Invalid OTP', {
        description: (
          <p className="text-xs text-red-300">
            Please enter a valid 6 digit alphanumeric OTP.
          </p>
        )
      })
      return
    }

    setIsLoading(true)
    setIsLoadingRefresh(true)
    toast.loading('Verifying OTP...')

    try {
      const { success, data } = await validateOTP()

      if (success && data) {
        setUser(data)

        if (data.isOnboardingFinished) {
          router.push('/')
        } else {
          router.push('/auth/account-details')
        }

        Cookies.set(
          'isOnboardingFinished',
          data.isOnboardingFinished ? 'true' : 'false'
        )

        toast.success('OTP verified successfully')
      }
    } finally {
      setIsLoading(false)
      setIsLoadingRefresh(false)
      toast.dismiss()
    }

    setIsLoading(false)
  }

  const handleResendOtp = async (): Promise<void> => {
    if (!user) {
      throw new Error('User not set in context')
    }

    setIsLoading(true)
    setIsLoadingRefresh(true)
    toast.loading('Sending OTP...')

    try {
      const { success } = await resendOtp()

      if (success) {
        toast.success('OTP successfully sent to your email')
      }
    } finally {
      setIsLoading(false)
      setIsLoadingRefresh(false)
      toast.dismiss()
    }
  }

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
            <span>{user?.email}</span>
          </div>
        </div>
        <div className="flex w-full justify-center">
          <form className="flex w-[17rem] flex-col gap-3">
            <div>
              <InputOTP
                maxLength={6}
                onChange={(otpVal) => {
                  setOtp(otpVal)
                }}
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                value={otp}
              >
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
            </div>

            <Button
              className="w-full"
              disabled={isLoading}
              onClick={handleVerifyOTP}
            >
              {isLoading ? <LoadingSVG className="w-10" /> : 'Verify'}
            </Button>
            <div className="space-x-reverse-2 flex items-center justify-center text-[#71717A]">
              <span>Didn’t receive OTP?</span>
              <span>
                {isLoadingRefresh ? (
                  <span>
                    <LoadingSVG className="h-10 w-10" />
                  </span>
                ) : (
                  <Button
                    className="text-[#71717A]"
                    disabled={isLoading}
                    onClick={handleResendOtp}
                    variant="link"
                  >
                    Resend OTP
                  </Button>
                )}
              </span>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
