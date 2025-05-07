'use client'
import { GeistSans } from 'geist/font/sans'
import React, { useEffect, useState, useMemo } from 'react'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import type { User } from '@keyshade/schema'
import { ErrorInfoSVG, LoadingSVG } from '@public/svg/shared'
import {
  GithubSVG,
  GoogleSVG,
  KeyshadeBigSVG,
  GitlabSVG
} from '@public/svg/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { userAtom } from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'

const GOOGLE_OAUTH_PATH = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`
const GITHUB_OAUTH_PATH = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/github`
const GITLAB_OAUTH_PATH = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/gitlab`

export default function AuthPage(): React.JSX.Element {
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

  return (
    <main className="flex h-dvh items-center justify-center px-4">
      {/* Constrain overall width */}
      <div className="flex w-full max-w-md flex-col gap-6">
        <div
          className={`${reason ? 'mb-4' : 'mb-14'} flex flex-col items-center`}
        >
          <KeyshadeBigSVG />
          <h1
            className={`${GeistSans.className} text-[2rem] font-semibold md:text-[2.5rem]`}
          >
            Welcome to Keyshade
          </h1>
        </div>

        {/* OAuth-failure banner */}
        {reason ? (
          <div className="rounded-md border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            <div className="flex items-center justify-around gap-4">
              <ErrorInfoSVG />
              <div>
                <strong className="font-medium">Login Error:</strong>{' '}
                <span className="opacity-90">
                  The email have been already used with a different OAuth
                  provider
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-3 gap-x-6">
          <Button onClick={() => (window.location.href = GOOGLE_OAUTH_PATH)}>
            <GoogleSVG />
          </Button>
          <Button onClick={() => (window.location.href = GITHUB_OAUTH_PATH)}>
            <GithubSVG />
          </Button>
          <Button onClick={() => (window.location.href = GITLAB_OAUTH_PATH)}>
            <GitlabSVG />
          </Button>
        </div>

        <div className="text-center text-white/40">or</div>

        <form className="flex flex-col gap-3">
          <label htmlFor="email">
            <Input
              disabled={isLoading}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setEmail(e.target.value)
              }}
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
        <div className="text-center text-xs text-[#808080]">
          By continuing, you acknowledge and agree to our <br />
          <a
            className="underline"
            href="https://keyshade.xyz/terms_and_condition"
            rel="noopener noreferrer"
            target="_blank"
          >
            Legal Terms
          </a>{' '}
          and{' '}
          <a
            className="underline"
            href="https://keyshade.xyz/privacy"
            rel="noopener noreferrer"
            target="_blank"
          >
            Privacy Policy
          </a>{' '}
          .
        </div>
      </div>
    </main>
  )
}
