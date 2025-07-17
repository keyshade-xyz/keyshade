import { useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { LoadingSVG } from '@public/svg/shared'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { userAtom } from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import { isEmptyString } from '@/lib/is-empty-string'
import { isEmailValid } from '@/lib/is-email-valid'

export default function AuthEmailForm() {
  const [isInvalidEmail, setIsInvalidEmail] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')

  const setUser = useSetAtom(userAtom)

  const router = useRouter()

  const sendOTP = useHttp(() =>
    ControllerInstance.getInstance().authController.sendOTP({
      email
    })
  )

  const handleGetStarted = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault()

    if (!isEmailValid(email)) {
      setIsInvalidEmail(true)
      return
    }

    setIsInvalidEmail(false)
    setIsLoading(true)

    toast.loading('Sending OTP...')

    try {
      const { success } = await sendOTP()
      if (success) {
        toast.success('OTP successfully sent to your email')
        router.push('/auth/otp')
        setUser({ email })
      }
    } finally {
      setIsLoading(false)
      toast.dismiss()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setEmail(value)
  }

  const loadErrorMessage = () => {
    if (isEmptyString(email)) return 'Email is required'

    return !isEmailValid(email) ? 'Invalid email' : null
  }

  const isButtonDisabled = isLoading || isEmptyString(email)

  return (
    <form className="flex flex-col gap-3" onSubmit={handleGetStarted}>
      <label htmlFor="email">
        <Input
          disabled={isLoading}
          onChange={handleInputChange}
          placeholder="Enter your mail "
          type="email"
        />
        {isInvalidEmail ? (
          <span className="text-xs text-red-400">{loadErrorMessage()}</span>
        ) : null}
      </label>

      <Button
        className="w-full"
        disabled={isButtonDisabled}
        type="submit"
      >
        {isLoading ? <LoadingSVG className="h-auto w-10" /> : 'Get Started'}
      </Button>
    </form>
  )
}
