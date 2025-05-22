'use client'

import { useAtomValue } from 'jotai'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { userAtom } from '@/store'
import { OtpHeader, OtpInputForm, OtpResend } from '@/components/auth/otp'


export default function AuthOTPPage(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const user = useAtomValue(userAtom)

  const router = useRouter()

  useEffect(() => {
    if (!user?.email) {
      router.push('/auth')
    }
  }, [router, user?.email])

  return (
    <main className="flex h-dvh items-center justify-center justify-items-center px-4">
      <div className="flex flex-col gap-6">
        <OtpHeader email={user?.email ?? 'email no found'} />
        <div className="flex w-full flex-col gap-6 items-center justify-center">
          <OtpInputForm isLoading={isLoading} setIsLoading={setIsLoading} />
          <OtpResend isLoading={isLoading} setIsLoading={setIsLoading} />
        </div>
      </div>
    </main>
  )
}
