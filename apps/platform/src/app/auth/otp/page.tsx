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

export default function AuthOTPPage(): React.JSX.Element {
  const [user, setUser] = useAtom(userAtom)

  const [otp, setOtp] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isInvalidOtp, setIsInvalidOtp] = useState<boolean>(false)
  const [isLoadingRefresh, setIsLoadingRefresh] = useState<boolean>(false)

  const router = useRouter()

  useEffect(() => {
    if (!user?.email) {
      router.push('/auth')
    }
  }, [router, user?.email])

  const handleVerifyOTP = async (): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain -- safe
    const userEmail = user?.email!
    const userOtp = otp

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
    toast.loading('Verifying OTP...')

    try {
      const { error, success, data } =
        await ControllerInstance.getInstance().authController.validateOTP({
          email: encodeURIComponent(userEmail),
          otp: userOtp
        })

      toast.dismiss()

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
      } else if (error) {
        // eslint-disable-next-line no-console -- we need to log the error
        console.log(error)

        toast.error('Failed to verify OTP', {
          description:
            error.statusCode === 401 ? (
              <p className="text-xs text-red-300">
                The OTP you entered is either incorrect or has expired. Please
                enter the correct OTP.
              </p>
            ) : (
              <p className="text-xs text-red-300">
                Something went wrong while verifying OTP. Check console for more
                info.
              </p>
            )
        })
      }
    } catch (error) {
      toast.dismiss()
      // eslint-disable-next-line no-console -- we need to log the error
      console.error(`Failed to verify OTP: ${error}`)
      toast.error('Something went wrong!', {
        description: (
          <p className="text-xs text-red-300">
            Something went wrong while verifying OTP. Check console for more
            info.
          </p>
        )
      })
    }

    setIsLoading(false)
  }

  const handleResendOtp = async (): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain -- safe
    const userEmail = user?.email!

    toast.loading('Sending OTP...')

    try {
      setIsLoadingRefresh(true)

      const { error, success } =
        await ControllerInstance.getInstance().authController.resendOTP({
          userEmail
        })

      toast.dismiss()
      if (success) {
        toast.success('OTP successfully sent to your email')
        setIsLoadingRefresh(false)
      } else {
        // eslint-disable-next-line no-console -- we need to log the error
        console.log(error)
        toast.error('Something went wrong!', {
          description: (
            <p className="text-xs text-red-300">
              Something went wrong sending the OTP. Check console for more info.
            </p>
          )
        })
        setIsLoadingRefresh(false)
      }
    } catch (error) {
      toast.dismiss()
      // eslint-disable-next-line no-console -- we need to log the error
      console.error(`Failed to send OTP: ${error}`)
      toast.error('Something went wrong!', {
        description: (
          <p className="text-xs text-red-300">
            Something went wrong sending the OTP. Check console for more info.
          </p>
        )
      })
      setIsLoadingRefresh(false)
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
              <span className="text-xs text-red-400">
                {isInvalidOtp ? 'Invalid OTP' : null}
              </span>
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
