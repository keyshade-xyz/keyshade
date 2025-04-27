import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAtom, useSetAtom } from 'jotai'
import { TrashSVG } from '@public/svg/shared'
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
import {
  deleteSecretOpenAtom,
  projectSecretCountAtom,
  secretsOfProjectAtom,
  selectedSecretAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'

function ConfirmDeleteSecret() {
  const [selectedSecret, setSelectedSecret] = useAtom(selectedSecretAtom)
  const [isDeleteSecretOpen, setIsDeleteSecretOpen] =
    useAtom(deleteSecretOpenAtom)
  const setSecrets = useSetAtom(secretsOfProjectAtom)
  const setProjectSecretCount = useSetAtom(projectSecretCountAtom)

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const deleteSecret = useHttp(() =>
    ControllerInstance.getInstance().secretController.deleteSecret({
      secretSlug: selectedSecret!.secret.slug
    })
  )

  const handleClose = useCallback(() => {
    setIsDeleteSecretOpen(false)
  }, [setIsDeleteSecretOpen])

  const handleDeleteSecret = useCallback(async () => {
    if (selectedSecret) {
      setIsLoading(true)
      toast.loading('Deleting secret...')

      try {
        const { success } = await deleteSecret()

        if (success) {
          setProjectSecretCount((prev) => prev - 1)
          toast.success('Secret deleted successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                The secret has been deleted.
              </p>
            )
          })

          // Remove the secret from the store
          setSecrets((prevSecrets) =>
            prevSecrets.filter(
              ({ secret }) => secret.slug !== selectedSecret.secret.slug
            )
          )
          setSelectedSecret(null)
        }
      } finally {
        setIsLoading(false)
        toast.dismiss()
        setSelectedSecret(null)
        handleClose()
      }
    }
  }, [
    selectedSecret,
    deleteSecret,
    setSecrets,
    setSelectedSecret,
    handleClose,
    setProjectSecretCount
  ])

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
            disabled={isLoading}
            onClick={handleDeleteSecret}
          >
            Yes, delete {selectedSecret?.secret.name}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDeleteSecret
