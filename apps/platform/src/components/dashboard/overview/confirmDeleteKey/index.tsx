import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useAtom, useSetAtom } from 'jotai'
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
  privateKeyStorageTypeAtom,
  selectedProjectPrivateKeyAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'

interface ConfirmDeleteKeyDialogProps {
  isOpen: boolean
  onClose: () => void
  currentProject: string
}

function ConfirmDeleteKeyDialog({
  isOpen,
  onClose,
  currentProject
}: ConfirmDeleteKeyDialogProps): React.JSX.Element {
  const setProjectPrivateKey = useSetAtom(selectedProjectPrivateKeyAtom)
  const setLocalProjectPrivateKey = useSetAtom(localProjectPrivateKeyAtom)
  const [privateKeyStorageType, setPrivateKeyStorageType] = useAtom(
    privateKeyStorageTypeAtom
  )
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const deletePrivateKey = useHttp(() =>
    ControllerInstance.getInstance().projectController.updateProject({
      projectSlug: currentProject,
      storePrivateKey: false
    })
  )

  const isPrivateKeyInDb = privateKeyStorageType === 'IN_DB'
  const handleDeleteSecret = useCallback(async () => {
    setIsLoading(true)
    if (isPrivateKeyInDb) {
      await deletePrivateKey()
    } else {
      setLocalProjectPrivateKey((prev) =>
        prev.filter((pair) => pair.slug !== currentProject)
      )
    }
    setProjectPrivateKey(null)
    setPrivateKeyStorageType('NONE')
    toast.success('Private key is deleted successfully!')
    setIsLoading(false)
    onClose()
  }, [
    onClose,
    setLocalProjectPrivateKey,
    setProjectPrivateKey,
    currentProject,
    deletePrivateKey,
    setPrivateKeyStorageType,
    isPrivateKeyInDb
  ])

  return (
    <AlertDialog onOpenChange={onClose} open={isOpen}>
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#1E1E1F] ">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">
            Do you want to delete Private key from{' '}
            {isPrivateKeyInDb ? 'server' : 'browser'}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-gray-400">
            This action cannot be undone. This will delete your private key so
            you can&apos;t decrypt your secrets.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-md border border-white/60 text-white/80"
            onClick={onClose}
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
