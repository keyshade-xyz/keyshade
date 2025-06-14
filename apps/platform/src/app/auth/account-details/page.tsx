'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/store'
import AccountDetailsHeader from '@/components/auth/account-details/account-details-header'
import AccountDetailsForm from '@/components/auth/account-details/account-details-form'

export default function AuthDetailsPage(): React.JSX.Element {
  const user = useAtomValue(userAtom)

  const [name, setName] = useState<string>(user?.name ?? '')

  const router = useRouter()

  useEffect(() => {
    if (!user?.email) {
      router.push('/auth')
    }

    setName(user?.name ?? '')
  }, [router, user?.email, user?.name])

  return (
    <main className="flex h-dvh items-center justify-center justify-items-center px-4">
      <div className="flex flex-col ">
        <AccountDetailsHeader />
        <AccountDetailsForm name={name} setName={setName} />
      </div>
    </main>
  )
}
