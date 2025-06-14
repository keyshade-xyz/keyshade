'use client'
import React, { useEffect, useMemo } from 'react'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import type { User } from '@keyshade/schema'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { userAtom } from '@/store'
import {
  AuthEmailForm,
  AuthErrorBanner,
  AuthHeader,
  AuthSocialGrid,
  AuthTnC
} from '@/components/auth'

export default function AuthPage(): React.JSX.Element {
  const setUser = useSetAtom(userAtom)

  const router = useRouter()

  // Memoize searchParams to prevent recreation on every render
  const searchParams = useMemo(() => {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search)
    }
    return new URLSearchParams()
  }, [])

  // Check if there was OAuth failure
  const reason = useMemo(() => searchParams.get('reason'), [searchParams])

  useEffect(() => {
    const urlEncodedData = searchParams.get('data')

    if (!urlEncodedData) {
      // Not OAuth login
      return
    }

    const decodedJSONData = decodeURIComponent(urlEncodedData)
    if (decodedJSONData) {
      const data = JSON.parse(decodedJSONData) as User
      setUser(data)

      Cookies.set('isOnboardingFinished', `${data.isOnboardingFinished}`, {
        expires: 7
      })
      router.push('/')

      toast.success('Successfully logged in!', {
        description: (
          <p className="text-xs text-green-300">
            Successfully logged in as {data.name}
          </p>
        )
      })
    } else {
      toast.error('Something went wrong while logging you in!', {
        description: (
          <p className="text-xs text-red-300">
            Something went wrong while logging you in. Check console for more
            info.
          </p>
        )
      })
      throw new Error(
        `Expected JSON Object in query param for OAuth login. Got ${urlEncodedData}`
      )
    }
  }, [router, searchParams, setUser])

  return (
    <main className="flex h-dvh items-center justify-center px-4">
      {/* Constrain overall width */}
      <div className="flex w-full max-w-md flex-col gap-6">
        <AuthHeader reason={reason} />
        {/* OAuth-failure banner */}
        <AuthErrorBanner reason={reason} />
        <AuthSocialGrid />

        <div className="text-center text-white/40">or</div>

        <AuthEmailForm />
        <AuthTnC />
      </div>
    </main>
  )
}
