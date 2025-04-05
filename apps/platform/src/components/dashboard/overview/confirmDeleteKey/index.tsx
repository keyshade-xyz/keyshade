import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useSetAtom } from 'jotai'
import { TrashWhiteSVG } from '@public/svg/shared'
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
  localProjectPrivateKeyAtom,
  selectedProjectPrivateKeyAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'

interface ConfirmDeleteKeyDialogProps {
  isOpen: boolean
  onClose: () => void
  currentProject: string
  isStoredOnServer: boolean
}

function ConfirmDeleteKeyDialog({
  isOpen,
  onClose,
  currentProject,
  isStoredOnServer
}: ConfirmDeleteKeyDialogProps): React.JSX.Element {
  const setProjectPrivateKey = useSetAtom(selectedProjectPrivateKeyAtom)
  const setLocalProjectPrivateKey = useSetAtom(localProjectPrivateKeyAtom)
  const [isLoading, setIsLoading] = useState(false)

  const deletePrivateKey = useHttp(() =>
    ControllerInstance.getInstance().projectController.updateProject({
      projectSlug: currentProject,
      storePrivateKey: false
    })
  )

  const handleDeleteSecret = useCallback(async () => {
    setIsLoading(true)
    if (isStoredOnServer) {
      await deletePrivateKey()
    } else {
      setLocalProjectPrivateKey((prev) =>
        prev.filter((pair) => pair.slug !== currentProject)
      )
    }
    setProjectPrivateKey(null)
    toast.success('Private key is deleted successfully!')
    onClose()
  }, [
    onClose,
    setLocalProjectPrivateKey,
    setProjectPrivateKey,
    currentProject,
    isStoredOnServer,
    deletePrivateKey
  ])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <AlertDialog onOpenChange={handleClose} open={isOpen}>
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#1E1E1F] ">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">
            Do you want to delete Private key from{' '}
            {isStoredOnServer ? 'server' : 'browser'}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-gray-400">
            This action cannot be undone. This will delete your private key so
            you can&apos;t decrypt your secrets.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-md border border-white/60 text-white/80"
            onClick={handleClose}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="flex gap-1 rounded-md bg-[#DC2626] text-white hover:bg-[#DC2626]/80"
            disabled={isLoading}
            onClick={handleDeleteSecret}
          >
            <TrashWhiteSVG />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDeleteKeyDialog
