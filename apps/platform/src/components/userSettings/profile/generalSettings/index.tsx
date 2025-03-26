import { useAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { User } from 'lucide-react'
import Image from 'next/image'
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
  }, [user?.name, userDetails])

  useEffect(() => {
    if (!user?.name) return
    setUserDetails({
      name: user.name
    })
  }, [user?.name])

  return (
    <>
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="aspect-square w-[60px] rounded-full" >
          {user?.profilePictureUrl ? (
            <Image
              alt="Profile Picture"
              className="rounded-full"
              height={60}
              src={user.profilePictureUrl}
              width={60}
            />
          ) : (
            <div className='h-full w-full flex justify-center items-center border-2 border-white/70 rounded-full'>
              <User className='h-[60%] w-[60%]' />
            </div>
          )}
        </div>
        {/* This is will be replaced by an image tag */}
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">Avatar</div>
          <span className="text-sm text-white/70">
            Upload a picture to change your avatar across Keyshade.
          </span>
        </div>
      </div>
      {/* Name */}
      <div className="inline-flex w-fit backdrop:flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">Name</div>
          <span className="text-sm text-white/70">
            Your name is how you&apos;re identified across Keyshade.
          </span>
        </div>
        <div>
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
              disabled={!isModified || isLoading}
              onClick={handleUpdateSelf}
              variant="secondary"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
