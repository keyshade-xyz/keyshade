import type { Dispatch, SetStateAction } from 'react'
import React from 'react'
import { useAtomValue } from 'jotai'
import { toast } from 'sonner'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { userAtom } from '@/store'

interface OtpResendProps {
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
}

export default function OtpResend({ isLoading, setIsLoading }: OtpResendProps) {
  const user = useAtomValue(userAtom)

  const resendOtp = useHttp(() => {
    if (user?.email) {
      return ControllerInstance.getInstance().authController.resendOTP({
        userEmail: user.email
      })
    }
    throw new Error('User not set in context')
  })

  const handleResendOtp = async (): Promise<void> => {
    if (!user) {
      throw new Error('User not set in context')
    }

    setIsLoading(true)
    toast.loading('Sending OTP...')

    try {
      const { success } = await resendOtp()

      if (success) {
        toast.success('OTP successfully sent to your email')
      }
    } finally {
      setIsLoading(false)
      toast.dismiss()
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 text-[#71717A]">
      <span>Didn’t receive OTP?</span>
      <button
        className="text-[#71717A]"
        disabled={isLoading}
        onClick={handleResendOtp}
        type="button"
      >
        Resend OTP
      </button>
    </div>
  )
}
