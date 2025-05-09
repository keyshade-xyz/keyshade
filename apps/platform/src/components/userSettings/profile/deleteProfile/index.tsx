import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useAtomValue, useSetAtom } from 'jotai'
import DeleteProfileDialog from '../deleteProfileDialog'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { logout } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { deleteAccountOpenAtom } from '@/store'

export default function DeleteProfile(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false)
  const isDeleteAccountOpen = useAtomValue(deleteAccountOpenAtom)
  const setIsDeleteAccountOpenAtom = useSetAtom(deleteAccountOpenAtom)

  const deleteSelf = useHttp(() =>
    ControllerInstance.getInstance().userController.deleteSelf()
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
      toast.dismiss()
    }
  }, [deleteSelf])

  return (
    <div className=" flex max-w-[30vw] justify-between rounded-3xl border border-red-500  bg-red-500/5 px-6 py-8">
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
          onClick={() => setIsDeleteAccountOpenAtom(true)}
          variant="destructive"
        >
          Delete
        </Button>

        {/* Delete Account Dialog */}
        {isDeleteAccountOpen ? (
          <DeleteProfileDialog handleDeleteSelf={handleDeleteSelf} />
        ) : null}
      </div>
    </div>
  )
}
