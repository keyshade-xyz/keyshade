import React, { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { TrashSVG } from '@public/svg/shared'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  deleteSecretOpenAtom,
  secretsOfProjectAtom,
  selectedSecretAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'

function ConfirmDeleteSecret() {
  const selectedSecret = useAtomValue(selectedSecretAtom)
  const setSelectedSecret = useSetAtom(selectedSecretAtom)
  const [isDeleteSecretOpen, setIsDeleteSecretOpen] =
    useAtom(deleteSecretOpenAtom)
  const setSecrets = useSetAtom(secretsOfProjectAtom)

  const handleClose = useCallback(() => {
    setIsDeleteSecretOpen(false)
  }, [setIsDeleteSecretOpen])

  const deleteSecret = useCallback(async () => {
    if (selectedSecret === null) {
      toast.error('No secret selected', {
        description: (
          <p className="text-xs text-red-300">
            No secret selected. Please select a secret.
          </p>
        )
      })
      return
    }

    const secretSlug = selectedSecret.secret.slug

    const { success, error } =
      await ControllerInstance.getInstance().secretController.deleteSecret(
        { secretSlug },
        {}
      )

    if (success) {
      toast.success('Secret deleted successfully', {
        description: (
          <p className="text-xs text-emerald-300">
            The secret has been deleted.
          </p>
        )
      })

      // Remove the secret from the store
      setSecrets((prevSecrets) =>
        prevSecrets.filter(({ secret }) => secret.slug !== secretSlug)
      )

      setSelectedSecret(null)
    }
    if (error) {
      toast.error('Something went wrong!', {
        description: (
          <p className="text-xs text-red-300">
            Something went wrong while deleting the secret. Check console for
            more info.
          </p>
        )
      })
      // eslint-disable-next-line no-console -- we need to log the error
      console.error(error)
    }

    handleClose()
  }, [setSecrets, selectedSecret, handleClose])

  //Cleaning the pointer events for the context menu after closing the alert dialog
  const cleanup = useCallback(() => {
    document.body.style.pointerEvents = ''
    document.documentElement.style.pointerEvents = ''
  }, [])

  useEffect(() => {
    if (!isDeleteSecretOpen) {
      cleanup()
    }
    return () => cleanup()
  }, [isDeleteSecretOpen, cleanup])

  return (
    <AlertDialog
      aria-hidden={!isDeleteSecretOpen}
      onOpenChange={handleClose}
      open={isDeleteSecretOpen}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <TrashSVG />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you really want to delete {selectedSecret?.secret.name}?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This action cannot be undone. This will permanently delete your
            secret and remove your secret data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-md bg-[#F4F4F5] text-black hover:bg-[#F4F4F5]/80 hover:text-black"
            onClick={handleClose}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-md bg-[#DC2626] text-white hover:bg-[#DC2626]/80"
            onClick={deleteSecret}
          >
            Yes, delete {selectedSecret?.secret.name}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDeleteSecret
