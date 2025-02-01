'use client'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useAtomValue } from 'jotai'
import Cookies from 'js-cookie'
import { LoadingSVG } from '@public/svg/shared'
import { KeyshadeBigSVG } from '@public/svg/auth'
import { GeistSansFont, NunitoSansFont } from '@/fonts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authEmailAtom } from '@/store'

export default function AuthDetailsPage(): React.JSX.Element {
  const email = useAtomValue(authEmailAtom)
  const [name, setName] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter()

  useEffect(() => {
    if (email === '') {
      router.push('/auth')
    }
  }, [email, router])

  const handleDoneUpdateSubmit = async (userName: string): Promise<void> => {
    const resultName = z.string().safeParse(userName)

    if (!resultName.success) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: userName, isOnboardingFinished: true })
        }
      )
      if (response.status === 200) {
        Cookies.set('isOnboardingFinished', 'true')
        router.push('/')
      }
    } catch (error) {
      throw new Error(JSON.stringify(error))
      setIsLoading(false)
    }
  }

  return (
    <main className="flex h-dvh items-center justify-center justify-items-center px-4">
      <div className="flex flex-col ">
        <div className="mb-12 flex flex-col items-center">
          <KeyshadeBigSVG />
          <h1
            className={`${GeistSansFont.className} text-[2.5rem] font-semibold`}
          >
            Almost Done
          </h1>
          <div className="flex w-[15rem] flex-col items-center text-center">
            <span className={GeistSansFont.className}>
              Fill up the rest details and start your way to security
            </span>
          </div>
        </div>

        <form className="flex flex-col gap-y-12 rounded-xl bg-[#191A1C] px-10 py-5 md:px-[7vw] md:py-8 2xl:py-12">
          <div className="space-y-4 md:w-[20vw]">
            <div>
              <span className={`${NunitoSansFont.className} text-sm`}>
                Your Name
              </span>
              <Input
                onChange={(e) => {
                  setName(e.target.value)
                }}
                placeholder="Enter your name"
              />
            </div>
            {/* <div>
              <span className={`${NunitoSansFont.className} text-sm`}>
                Your Workspace Name
              </span>
              <Input placeholder="Enter your workspace name" />
            </div> */}
            {/* <div>
              <span className={`${NunitoSansFont.className} text-sm`}>
                Organization Mail
              </span>
              <Input placeholder="Enter your mail" type="email" />
            </div> */}
          </div>
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={() => {
              void handleDoneUpdateSubmit(name)
            }}
          >
            {isLoading ? <LoadingSVG className="w-10" /> : 'Done'}
          </Button>
        </form>
      </div>
    </main>
  )
}
