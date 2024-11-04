'use client'
import { GeistSans } from 'geist/font/sans'
import React, { useEffect, useState } from 'react'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useAtom } from 'jotai'
import Cookies from 'js-cookie'
import { LoadingSVG } from '@public/svg/shared'
import {
  GithubSVG,
  GoogleSVG,
  KeyshadeBigSVG,
  GitlabSVG
} from '@public/svg/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authEmailAtom } from '@/store'
import type { User } from '@/types'

export default function AuthPage(): React.JSX.Element {
  const [email, setEmail] = useAtom(authEmailAtom)
  const [inInvalidEmail, setInInvalidEmail] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const router = useRouter()

  Cookies.set('isOnboardingFinished', 'false', { expires: 7 })

  const handleGetStarted = async (userEmail: string): Promise<void> => {
    const result = z.string().email().safeParse(userEmail)
    if (!result.success) {
      setInInvalidEmail(true)
      return
    }
    setIsLoading(true)
    setInInvalidEmail(false)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/send-otp/${encodeURIComponent(userEmail)}`,
        {
          method: 'POST'
        }
      )
      if (response.status === 201) {
        router.push('/auth/otp')
      }
    } catch (error) {
      setIsLoading(false)
      // eslint-disable-next-line no-console -- we need to log the error
      console.error(`Failed to send OTP: ${error}`)
    }
  }

  const handleGithubLogin = (): void => {
    setIsLoading(true)
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/github`
  }

  const handleGithubRedirect = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')

    if (code) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/github/callback?code=${code}`,
          {
            method: 'GET',
            credentials: 'include'
          }
        )

        if (!response.ok) {
          throw new Error('Network response was not ok')
        }

        const data = (await response.json()) as User
        setEmail(data.email)

        if (response.status === 200) {
          router.push('/auth/account-details')
        }
      } catch (error) {
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(`Failed to fetch user data: ${error}`)
      }
    } else {
      // eslint-disable-next-line no-console -- we need to log the error
      console.error('No authorization code found in the URL')
    }
  }

  useEffect(() => {
    void handleGithubRedirect()
  }, [])

  return (
    <main className="flex h-dvh items-center justify-center justify-items-center px-4">
      <div className="flex flex-col gap-6">
        <div className="mb-14 flex flex-col items-center">
          <KeyshadeBigSVG />
          <h1
            className={`${GeistSans.className} text-[2rem] font-semibold md:text-[2.5rem]`}
          >
            Welcome to Keyshade
          </h1>
        </div>
        <div className="grid grid-cols-3 gap-x-6">
          <Button>
            <GoogleSVG />
          </Button>
          <Button
            onClick={() => {
              handleGithubLogin()
            }}
          >
            <GithubSVG />
          </Button>
          <Button>
            <GitlabSVG />
          </Button>
        </div>

        <div className="text-center text-white/40">or</div>

        <form className="flex flex-col gap-3">
          <label htmlFor="email">
            <Input
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setEmail(e.target.value)
              }}
              placeholder="Enter your mail "
              type="email"
            />
            <span className="text-xs text-red-400">
              {inInvalidEmail ? 'Invalid email' : null}
            </span>
          </label>

          <Button
            className="w-full"
            disabled={isLoading}
            onClick={() => {
              void handleGetStarted(email)
            }}
          >
            {isLoading ? <LoadingSVG className="w-10" /> : 'Get Started'}
          </Button>
        </form>
        {/* <Button className="w-full" variant="outline">
          Already have an account? Sign In
        </Button> */}
        <div className="text-center text-xs text-[#808080]">
          By continueing, you acknowledge and agree to our <br />
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
