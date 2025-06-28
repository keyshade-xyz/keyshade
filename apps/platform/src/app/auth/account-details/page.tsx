'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/store'
import AccountDetailsHeader from '@/components/auth/account-details/account-details-header'
import OnboardingStepper from '@/components/auth/account-details/onboarding-stepper'

export default function AuthDetailsPage(): React.JSX.Element {
  const user = useAtomValue(userAtom)
  const router = useRouter()

  useEffect(() => {
    if (!user?.email) {
      router.push('/auth')
    }
  }, [router, user?.email])

  return (
    <main className="flex h-dvh items-center justify-center justify-items-center px-4">
      <div className="flex flex-col ">
        <AccountDetailsHeader />
        <OnboardingStepper />
      </div>
    </main>
  )
}
