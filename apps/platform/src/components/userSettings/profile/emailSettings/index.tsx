import { useAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { GithubSVG, GitlabSVG, GoogleSVG } from '@public/svg/auth'
import { AuthProviderCard } from '../authProviderCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { logout } from '@/lib/utils'
import { userAtom } from '@/store'

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

  const renderAuthProviderUI = () => {
    if (user?.authProvider === 'EMAIL_OTP') {
      return (
        <>
          <span className="text-sm text-white/70">
            This is the email that you use to sign in to your account.
          </span>
          <Input
            disabled={isLoading || wasEmailSent}
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
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                value={otp}
              />
              <div className="mt-4 flex items-end justify-between gap-2">
                <Button
                  className="w-max text-sm text-white/50 underline"
                  onClick={handleResendEmailChangeOTP}
                  type="button"
                >
                  Resend OTP
                </Button>
                <Button
                  className="w-max"
                  disabled={isLoading || otp === ''}
                  onClick={handleValidateEmailChangeOTP}
                >
                  Verify OTP
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="w-max"
              disabled={isLoading || user.email === email || email === ''}
              onClick={handleUpdateSelf}
              variant="secondary"
            >
              Send OTP
            </Button>
          )}
        </>
      )
    }

    // For Google, GitHub, GitLab
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user?.authProvider === 'GOOGLE' && (
            <AuthProviderCard
              email={user.email ?? ''}
              icon={GoogleSVG}
              isActive={user.isActive ?? false}
              provider='GOOGLE'
            />
          )}
          {user?.authProvider === 'GITHUB' && (
            <AuthProviderCard
              email={user.email ?? ''}
              icon={GithubSVG}
              isActive={user.isActive ?? false}
              provider='GITHUB'
            />
          )}
          {user?.authProvider === 'GITLAB' && (
            <AuthProviderCard
              email={user.email ?? ''}
              icon={GitlabSVG}
              isActive={user.isActive ?? false}
              provider='GITLAB'
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {user ? (
        <div className="w-fit flex flex-col gap-4">
          <div className="text-xl font-semibold">Login method</div>
          {renderAuthProviderUI()}
        </div>
      ) : null}
    </>
  )
}
