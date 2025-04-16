import { useAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { AuthProviderEnum } from '@keyshade/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { logout } from '@/lib/utils'
import { userAtom } from '@/store'

const getFormattedAuthProvider = (authProvider: AuthProviderEnum): string => {
  const provider = authProvider.toLowerCase()
  return provider.charAt(0).toUpperCase() + provider.slice(1)
}

export default function EmailSettings(): React.JSX.Element {
  const [user, setUser] = useAtom(userAtom)

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [email, setEmail] = useState<string>(user?.email ?? '')
  const [otp, setOtp] = useState<string>('')
  const [wasEmailSent, setWasEmailSent] = useState<boolean>(false)

  const updateSelf = useHttp(() =>
    ControllerInstance.getInstance().userController.updateSelf({
      email
    })
  )

  const validateEmailChangeOTP = useHttp(() =>
    ControllerInstance.getInstance().userController.validateEmailChangeOTP({
      otp
    })
  )

  const resendEmailChangeOTP = useHttp(() =>
    ControllerInstance.getInstance().userController.resendEmailChangeOTP()
  )

  const handleValidateEmailChangeOTP = useCallback(async () => {
    toast.loading('Verifying OTP...')
    setIsLoading(true)

    try {
      const { success, data } = await validateEmailChangeOTP()

      if (success && data) {
        toast.success('OTP verified successfully! Logging you out...')
        setUser(data)
        setEmail(data.email)
        setWasEmailSent(false)
        setOtp('')
        logout()
      }
    } finally {
      setIsLoading(false)
      toast.dismiss()
    }
  }, [validateEmailChangeOTP, setUser])

  const handleResendEmailChangeOTP = useCallback(async () => {
    toast.loading('Resending OTP for email verification...')
    setIsLoading(true)

    try {
      const { success } = await resendEmailChangeOTP()

      if (success) {
        toast.success('An OTP has been resent to your email.')
      }
    } finally {
      setIsLoading(false)
      toast.dismiss()
    }
  }, [resendEmailChangeOTP])

  const handleUpdateSelf = useCallback(async () => {
    toast.loading('Sending OTP for email verification...')
    setIsLoading(true)

    try {
      const { success } = await updateSelf()

      if (success) {
        toast.success('An OTP has been sent to your email.')
        setWasEmailSent(true)
      }
    } finally {
      setIsLoading(false)
      toast.dismiss()
    }
  }, [updateSelf])

  useEffect(() => {
    if (!user?.email) return

    setEmail(user.email)
  }, [user?.email])

  return (
    <>
      {user ? (
        <div className="flex max-w-[20vw] flex-col gap-2">
          <div className="flex flex-col gap-2">
            <div className="text-xl font-semibold">Email</div>
            <span className="text-sm text-white/70">
              This is the email that you use to sign in to your account.
            </span>
            {user.authProvider !== 'EMAIL_OTP' && (
              <span className="text-sm text-amber-600">
                You are using {getFormattedAuthProvider(user.authProvider!)} as
                your authentication provider. You can not change your email.
              </span>
            )}
          </div>
          <Input
            disabled={
              user.authProvider !== 'EMAIL_OTP' || isLoading || wasEmailSent
            }
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            placeholder={user.email}
            value={email}
          />
          {wasEmailSent ? (
            <div className="flex flex-col gap-2">
              <Input
                disabled={isLoading}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOtp(e.target.value)
                }
                placeholder="Enter OTP"
                value={otp}
              />
              <div className="mt-4 flex items-end justify-between gap-2">
                <Button
                  className="text-sm text-white/50 underline"
                  onClick={handleResendEmailChangeOTP}
                  type="button"
                >
                  Resend OTP
                </Button>
                <Button
                  disabled={isLoading || otp === ''}
                  onClick={handleValidateEmailChangeOTP}
                >
                  Verify OTP
                </Button>
              </div>
            </div>
          ) : null}
          {!wasEmailSent ? (
            <Button
              className="mt-2"
              disabled={isLoading || user.email === email || email === ''}
              onClick={handleUpdateSelf}
              variant="secondary"
            >
              Send OTP
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
