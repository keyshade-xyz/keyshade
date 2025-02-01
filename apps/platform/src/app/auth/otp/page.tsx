'use client'
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp'
import { useAtomValue } from 'jotai'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import { LoadingSVG } from '@public/svg/shared'
import { KeyshadeBigSVG } from '@public/svg/auth'
import type { User } from '@keyshade/schema'
import { GeistSansFont } from '@/fonts'
import { Button } from '@/components/ui/button'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot
} from '@/components/ui/input-otp'
import { authEmailAtom } from '@/store'
import ControllerInstance from '@/lib/controller-instance'

export default function AuthOTPPage(): React.JSX.Element {
  const email = useAtomValue(authEmailAtom)

  const [otp, setOtp] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isInvalidOtp, setIsInvalidOtp] = useState<boolean>(false)
  const [isLoadingRefresh, setIsLoadingRefresh] = useState<boolean>(false)

  const router = useRouter()

  useEffect(() => {
    if (email === '') {
      router.push('/auth')
    }
  }, [email, router])

  const handleVerifyOTP = async (
    userEmail: string,
    userOtp: string
  ): Promise<void> => {
    const emailResult = z.string().email().safeParse(userEmail)
    const alphanumeric = z
      .string()
      .length(6)
      .refine((value) => /^[a-z0-9]+$/i.test(value), {
        message: 'OTP must be alphanumeric'
      })
    const otpResult = alphanumeric.safeParse(userOtp)
    if (!emailResult.success || !otpResult.success) {
      setIsInvalidOtp(true)
      return
    }
    setIsInvalidOtp(false)
    setIsLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/validate-otp?email=${userEmail}&otp=${userOtp}`,
        {
          method: 'POST',
          credentials: 'include'
        }
      )
      if (response.status === 401) {
        toast.warning(
          'The OTP you entered is either incorrect or has expired. Please enter the correct OTP.'
        )
        setIsLoading(false)
      }
      const user: User = (await response.json()) as User

      if (user.isOnboardingFinished) {
        Cookies.set('isOnboardingFinished', 'true')
        router.push('/')
      } else {
        Cookies.set('isOnboardingFinished', 'false')
        router.push('/auth/account-details')
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(`Invalid user data: ${error.message}`)
      } else {
        setIsLoading(false)
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(`Failed to verify OTP: ${error}`)
      }
    }
  }
  const handleResendOtp = async (userEmail: string): Promise<void> => {
    setIsLoadingRefresh(true)

    const { error, success } =
      await ControllerInstance.getInstance().authController.resendOTP({
        userEmail: encodeURIComponent(userEmail)
      })
    if (success) {
      toast.success('OTP successfully sent to your email')
      setIsLoadingRefresh(false)
    } else {
      setIsLoadingRefresh(false)
      throw new Error(JSON.stringify(error))
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
            <span>{email}</span>
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
              <span className="text-xs text-red-400">
                {isInvalidOtp ? 'Invalid OTP' : null}
              </span>
            </div>

            <Button
              className="w-full"
              disabled={isLoading}
              onClick={(e) => {
                e.preventDefault()
                void handleVerifyOTP(email, otp)
              }}
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
                    onClick={(e) => {
                      e.preventDefault()
                      void handleResendOtp(email)
                    }}
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
