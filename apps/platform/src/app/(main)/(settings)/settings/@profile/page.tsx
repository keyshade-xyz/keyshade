'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAtom, useAtomValue } from 'jotai'
import { useSearchParams } from 'next/navigation'
import InputLoading from './loading'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'
import {
  userAtom,
  apiKeysOfProjectAtom,
  deleteApiKeyOpenAtom,
  selectedApiKeyAtom
} from '@/store'
import AddApiKeyDialog from '@/components/userProfile/apiKeys/addApiKeyDialog'
import ApiKeyCard from '@/components/userProfile/apiKeys/apiKeyCard'
import ConfirmDeleteApiKey from '@/components/userProfile/apiKeys/confirmDeleteApiKey'
import { useHttp } from '@/hooks/use-http'
import { logout } from '@/lib/utils'

function ProfilePage(): React.JSX.Element {
  const [user, setUser] = useAtom(userAtom)
  const [apiKeys, setApiKeys] = useAtom(apiKeysOfProjectAtom)
  const isDeleteApiKeyOpen = useAtomValue(deleteApiKeyOpenAtom)
  const selectedApiKey = useAtomValue(selectedApiKeyAtom)

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [userData, setUserData] = useState({
    email: '',
    name: '',
    profilePictureUrl: ''
  })
  const [isModified, setIsModified] = useState<boolean>(false)

  const searchParams = useSearchParams()
  const tab = searchParams.get('profile') ?? 'profile'

  const updateSelf = useHttp(() =>
    ControllerInstance.getInstance().userController.updateSelf({
      name: userData.name === user?.name ? undefined : userData.name,
      email: userData.email === user?.email ? undefined : userData.email
    })
  )

  const deleteSelf = useHttp(() =>
    ControllerInstance.getInstance().userController.deleteSelf()
  )

  const getSelf = useHttp(() =>
    ControllerInstance.getInstance().userController.getSelf()
  )

  const getApiKeysOfUser = useHttp(() =>
    ControllerInstance.getInstance().apiKeyController.getApiKeysOfUser(
      {},
      {}
    )
  )

  const handleDeleteSelf = useCallback(async () => {
    toast.loading('Deleting profile...')
    setIsLoading(true)

    try {
      const { success } = await deleteSelf()

      if (success) {
        toast.success('Profile deleted successfully! Logging you out.')
        logout()
      }
    } finally {
      setIsLoading(false)
      setIsModified(false)
      toast.dismiss()
    }
  }, [deleteSelf])

  const handleUpdateSelf = useCallback(async () => {
    toast.loading('Updating profile...')
    setIsLoading(true)

    try {
      const { success, data } = await updateSelf()

      if (success && data) {
        toast.success('Profile updated successfully!')
        setUser(data)
      }
    } finally {
      setIsLoading(false)
      setIsModified(false)
      toast.dismiss()
    }
  }, [updateSelf, setUser])

  const getAllApiKeys = useCallback(async () => {
    setIsLoading(true)

    try {
      const { success, data } = await getApiKeysOfUser()

      if (success && data) {
        setApiKeys(data.items)
      }
    } finally {
      setIsLoading(false)
    }
  }, [setApiKeys, getApiKeysOfUser])

  useEffect(() => {
    getSelf()
      .then(({ data, success }) => {
        if (success && data) {
          setUserData({
            email: data.email,
            name: data.name,
            profilePictureUrl: data.profilePictureUrl || ''
          })
        }
      })
      .finally(() => setIsLoading(false))
  }, [getSelf])

  useEffect(() => {
    getAllApiKeys()
  }, [getAllApiKeys])

  return (
    <main className="flex flex-col gap-y-10">
      {/* Avatar */}
      <div className="flex gap-[5vw]">
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">Avatar</div>
          <span className="text-sm text-white/70">
            Upload a picture to change your avatar across Keyshade.
          </span>
        </div>
        <div className="aspect-square w-[5rem] rounded-full bg-gray-600" />
        {/* //! This is will be replaced by an image tag */}
      </div>
      {/* Name */}
      <div className="flex max-w-[20vw] flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">Name</div>
          <span className="text-sm text-white/70">
            Your name is how you&apos;re identified across Keyshade.
          </span>
        </div>
        {isLoading ? (
          <InputLoading />
        ) : (
          <Input
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setIsModified(true)
              setUserData((prev) => ({ ...prev, name: e.target.value }))
            }}
            placeholder="name"
            value={userData.name || ''}
          />
        )}
      </div>
      {/* Email */}
      <div className="flex max-w-[20vw] flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">Email</div>
          <span className="text-sm text-white/70">
            Your email is used to log in and receive notifications.
          </span>
        </div>
        {isLoading ? (
          <InputLoading />
        ) : (
          <Input
            disabled
            // onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            //   setIsModified(true)
            //   setEmail(e.target.value)
            // }}
            placeholder="email"
            value={user?.email}
          />
        )}
      </div>
      <div>
        <Button
          disabled={!isModified}
          onClick={handleUpdateSelf}
          variant="secondary"
        >
          Save Changes
        </Button>
      </div>
      <Separator className="w-full bg-white/15" />
      <div className="flex flex-row justify-between items-center gap-4 p-3">
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">API Keys</div>
          <span className="text-sm text-white/70">
            Generate new API keys to use with the Keyshade CLI.
          </span>
        </div>
        <div>
          {tab === 'profile' && <AddApiKeyDialog />}
        </div>
      </div>
      {isLoading ? (
        <div className="p-3">
          <InputLoading />
        </div>
      ) : (
        apiKeys.length !== 0 && (
          <div className={`grid h-fit w-full grid-cols-1 gap-8 p-3 text-white md:grid-cols-2 xl:grid-cols-3 `}>
            {apiKeys.map((apiKey) => (
              <ApiKeyCard apiKey={apiKey} key={apiKey.id} />
            ))}

            {/* Delete API Key alert dialog */}
            {isDeleteApiKeyOpen && selectedApiKey ? (
              <ConfirmDeleteApiKey />
            ) : null}
          </div>
        )
      )}

      <Separator className="w-full bg-white/15" />

      <div className=" flex max-w-[30vw] justify-between rounded-3xl border border-red-500  bg-red-500/5 px-10 py-8">
        <div>
          <h2 className={` text-xl font-bold text-red-500`}>Delete account</h2>
          <p className="max-w-[20rem] text-sm text-white/70">
            Your account will be permanently deleted and access will be lost to
            any of your teams and data. This action is irreversible.
          </p>
        </div>

        <div className="flex items-center">
          <Button
            aria-label="Delete account"
            disabled={isLoading}
            onClick={handleDeleteSelf}
            variant="destructive"
          >
            Delete
          </Button>
        </div>
      </div>
    </main>
  )
}

export default ProfilePage
