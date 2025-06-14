import React, { useState } from 'react'
import { LoadingSVG } from '@public/svg/shared'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { userAtom } from '@/store'

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

  const handleGetStarted = async (): Promise<void> => {
    const result = z.string().email().safeParse(email)
    if (!result.success) {
      setIsInvalidEmail(true)
      return
    }
    setIsLoading(true)
    setIsInvalidEmail(false)

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

  return (
    <form className="flex flex-col gap-3">
      <label htmlFor="email">
        <Input
          disabled={isLoading}
          onChange={handleInputChange}
          placeholder="Enter your mail "
          type="email"
        />
        <span className="text-xs text-red-400">
          {isInvalidEmail ? 'Invalid email' : null}
        </span>
      </label>

      <Button
        className="w-full"
        disabled={isLoading}
        onClick={handleGetStarted}
      >
        {isLoading ? <LoadingSVG className="h-auto w-10" /> : 'Get Started'}
      </Button>
    </form>
  )
}
