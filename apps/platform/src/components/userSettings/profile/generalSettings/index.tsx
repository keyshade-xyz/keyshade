import { useAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { userAtom } from '@/store'

export default function GeneralSettings(): React.JSX.Element {
  const [user, setUser] = useAtom(userAtom)

  const [userDetails, setUserDetails] = useState<{
    name: string
  }>({
    name: user?.name ?? ''
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isModified, setIsModified] = useState<boolean>(false)

  const updateSelf = useHttp(() =>
    ControllerInstance.getInstance().userController.updateSelf({
      name: userDetails.name === user?.name ? undefined : userDetails.name
    })
  )

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

  useEffect(() => {
    setIsModified(userDetails.name !== user?.name)

    if (!user?.name) return

    setUserDetails({
      name: user.name
    })
  }, [user?.name, userDetails])

  return (
    <>
      {/* Avatar */}
      <div className="flex gap-4">
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
      <div className="flex max-w-[20vw] flex-col gap-2">
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">Name</div>
          <span className="text-sm text-white/70">
            Your name is how you&apos;re identified across Keyshade.
          </span>
        </div>
        <Input
          disabled={isLoading}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setIsModified(true)
            setUserDetails((prev) => ({ ...prev, name: e.target.value }))
          }}
          placeholder="John Doe"
          value={userDetails.name || ''}
        />
        <div>
          <Button
            className="mt-4"
            disabled={!isModified}
            onClick={handleUpdateSelf}
            variant="secondary"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </>
  )
}
