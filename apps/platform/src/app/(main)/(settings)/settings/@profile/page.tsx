'use client'

import React, { useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { Separator } from '@/components/ui/separator'
import ControllerInstance from '@/lib/controller-instance'
import { userAtom } from '@/store'
import { useHttp } from '@/hooks/use-http'
import GeneralSettings from '@/components/userSettings/profile/generalSettings'
import EmailSettings from '@/components/userSettings/profile/emailSettings'
import DeleteProfile from '@/components/userSettings/profile/deleteProfile'
import ApiKeySection from '@/components/userSettings/apiKeys/apiKeySection'
import AuthProvider from '@/components/userSettings/profile/authProvider'
import ShareReferralCode from '@/components/userSettings/profile/shareReferralCode'

function ProfilePage(): React.JSX.Element {
  const setUser = useSetAtom(userAtom)

  const getSelf = useHttp(() =>
    ControllerInstance.getInstance().userController.getSelf({
      'cache-control': 'no-cache',
      pragma: 'no-cache'
    })
  )

  useEffect(() => {
    getSelf().then(({ data, success }) => {
      if (success && data) {
        setUser(data)
      }
    })
  }, [getSelf, setUser])

  return (
    <main className="flex flex-col gap-y-10">
      <div className="pt-4">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-2.5 font-medium text-white/60">
          Changes made to your profile will be applied to all of your
          workspaces.
        </p>
      </div>
      <GeneralSettings />
      <EmailSettings />
      <AuthProvider />
      <Separator className="w-full bg-white/15" />
      <ShareReferralCode />
      <Separator className="w-full bg-white/15" />
      <ApiKeySection />
      <Separator className="w-full bg-white/15" />
      <DeleteProfile />
    </main>
  )
}

export default ProfilePage
