import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useSetAtom } from 'jotai'
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
import { selectedProjectPrivateKeyAtom } from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'

interface ServerKeySetupDialogProps {
  isOpen: boolean
  onClose: () => void
  currentProjectSlug: string
}

function ServerKeySetupDialog({
  isOpen,
  onClose,
  currentProjectSlug
}: ServerKeySetupDialogProps): React.JSX.Element {
  const [keyValue, setKeyValue] = useState<string>('')
  const setProjectPrivateKey = useSetAtom(selectedProjectPrivateKeyAtom)

  const SavePrivateKey = useHttp((key: string) =>
    ControllerInstance.getInstance().projectController.updateProject({
      projectSlug: currentProjectSlug,
      regenerateKeyPair: true,
      privateKey: key
    })
  )

  const handleSaveChanges = useCallback(async () => {
    const response = await SavePrivateKey(keyValue)
    if (!response.error) {
      setProjectPrivateKey(keyValue)
      toast.success('Key saved successfully!')
    }
    onClose()
  }, [keyValue, onClose, setProjectPrivateKey, SavePrivateKey])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <AlertDialog onOpenChange={handleClose} open={isOpen}>
      <AlertDialogContent className="rounded-lg border border-white/25 bg-black/70">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">
            Save the private key on our server
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-gray-400">
            Storing the private key with us will enable you and your team to
            easily view the secrets of this project without needing the hassle
            of setting the key up in their browsers. Although, this comes with
            the downside of accidental leaks.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="p-4">
          <input
            className="w-full rounded-md border border-gray-300 bg-gray-800 p-2 text-white"
            onChange={(e) => setKeyValue(e.target.value)}
            placeholder="Enter your private key"
            type="text"
            value={keyValue}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-md border border-white/60 text-white/60 hover:border-white/80"
            onClick={handleClose}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-md bg-white/60 text-black hover:bg-white/80"
            onClick={handleSaveChanges}
          >
            Save Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ServerKeySetupDialog
