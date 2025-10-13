import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp'
import type { Dispatch, SetStateAction } from 'react'
import React, { useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { posthog } from 'posthog-js'
import Cookies from 'js-cookie'
import { LoadingSVG } from '@public/svg/shared'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot
} from '@/components/ui/input-otp'
import { Button } from '@/components/ui/button'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { userAtom } from '@/store'
import { isEmailValid } from '@/lib/is-email-valid'
import { accountManager } from '@/lib/account-manager'

interface OtpInputFormProps {
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
}

export default function OtpInputForm({
  isLoading,
  setIsLoading
}: OtpInputFormProps) {
  const [otp, setOtp] = useState<string>('')

  const [user, setUser] = useAtom(userAtom)

  const router = useRouter()

  const validateOTP = useHttp(() => {
    if (user?.email) {
      return ControllerInstance.getInstance().authController.validateOTP({
        email: user.email,
        otp
      })
    }
    throw new Error('User not set in context')
  })

  const handleVerifyOTP = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault()

    if (!user) {
      throw new Error('User not set in context')
    }

    const isOtpValid = isAlphanumeric(otp)

    if (!isEmailValid(user.email) || !isOtpValid) {
      toast.error('Invalid OTP', {
        description: (
          <p className="text-xs text-red-300">
            Please enter a valid 6 digit alphanumeric OTP.
          </p>
        )
      })
      return
    }

    setIsLoading(true)
    toast.loading('Verifying OTP...')

    try {
      const { success, data } = await validateOTP()

      if (success && data) {
        setUser(data)

        // Add the account to the account manager (token managed by backend cookie)
        accountManager.addProfile(data)

        if (data.isOnboardingFinished) {
          router.push('/')
          posthog.identify()
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
      toast.dismiss()
    }
  }

  const isAlphanumeric = (value: string): boolean => {
    const result = z
      .string()
      .length(6)
      .refine((str) => /^[a-z0-9]+$/i.test(str), {
        message: 'OTP must be alphanumeric'
      })
      .safeParse(value)

    return result.success
  }

  const isButtonDisabled = (): boolean => {
    return (
      isLoading ||
      otp.length !== 6 ||
      !isAlphanumeric(otp) ||
      !isEmailValid(user?.email)
    )
  }

  return (
    <form className="flex w-[17rem] flex-col gap-3" onSubmit={handleVerifyOTP}>
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

      <Button className="w-full" disabled={isButtonDisabled()} type="submit">
        {isLoading ? <LoadingSVG className="w-10" /> : 'Verify'}
      </Button>
    </form>
  )
}
