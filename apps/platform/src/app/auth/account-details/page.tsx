'use client'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useAtom } from 'jotai'
import Cookies from 'js-cookie'
import { LoadingSVG } from '@public/svg/shared'
import { KeyshadeBigSVG } from '@public/svg/auth'
import { toast } from 'sonner'
import { GeistSansFont, NunitoSansFont } from '@/fonts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { userAtom } from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'

export default function AuthDetailsPage(): React.JSX.Element {
  const [user, setUser] = useAtom(userAtom)

  const [name, setName] = useState<string>(user?.name ?? '')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const router = useRouter()

  const updateSelf = useHttp(() =>
    ControllerInstance.getInstance().userController.updateSelf({
      name,
      isOnboardingFinished: true
    })
  )

  useEffect(() => {
    if (!user?.email) {
      router.push('/auth')
    }

    setName(user?.name ?? '')
  }, [router, user?.email, user?.name])

  const handleDoneUpdateSubmit = async (): Promise<void> => {
    const resultName = z.string().safeParse(name)

    if (!resultName.success) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)

    toast.loading('Updating profile details...')
    try {
      const { success, data } = await updateSelf()

      if (success && data) {
        toast.success('Profile details successfully updated')

        Cookies.set(
          'isOnboardingFinished',
          data.isOnboardingFinished ? 'true' : 'false'
        )

        setUser(data)
      }
    } finally {
      toast.dismiss()
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
                value={name}
              />
            </div>
          </div>
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={handleDoneUpdateSubmit}
          >
            {isLoading ? <LoadingSVG className="w-10" /> : 'Done'}
          </Button>
        </form>
      </div>
    </main>
  )
}
