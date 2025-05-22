import Cookies from 'js-cookie'
import type { Dispatch, SetStateAction} from 'react';
import React, { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { posthog } from 'posthog-js'
import { useSetAtom } from 'jotai'
import { LoadingSVG } from '@public/svg/shared'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import { NunitoSansFont } from '@/fonts'
import { Input } from '@/components/ui/input'
import { userAtom } from '@/store'
import { Button } from '@/components/ui/button'

interface AccountDetailsFormProps {
  name: string
  setName: Dispatch<SetStateAction<string>>
}

export default function AccountDetailsForm({
  name,
  setName
}: AccountDetailsFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const setUser = useSetAtom(userAtom)

  const updateSelf = useHttp(() =>
    ControllerInstance.getInstance().userController.updateSelf({
      name,
      isOnboardingFinished: true
    })
  )

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
        posthog.identify()

        /**
         * redirect to dashboard after updating the profile details
         */
        window.location.href = '/'
      }
    } finally {
      toast.dismiss()
      setIsLoading(false)
    }
  }

  return (
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
  )
}
