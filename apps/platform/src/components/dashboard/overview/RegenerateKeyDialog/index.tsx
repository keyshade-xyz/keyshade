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

interface RegenerateKeyDialogProps {
  isOpen: boolean
  onClose: () => void
  currentProjectSlug: string
}

function RegenerateKeyDialog({
  isOpen,
  onClose,
  currentProjectSlug
}: RegenerateKeyDialogProps): React.JSX.Element {
  const [keyValue, setKeyValue] = useState<string>('')
  const setProjectPrivateKey = useSetAtom(selectedProjectPrivateKeyAtom)

  const RegeneratePrivateKey = useHttp((key: string) =>
    ControllerInstance.getInstance().projectController.updateProject({
      projectSlug: currentProjectSlug,
      regenerateKeyPair: true,
      privateKey: key
    })
  )

  const handleSaveChanges = useCallback(async () => {
    const response = await RegeneratePrivateKey(keyValue)
    if (!response.error) {
      setProjectPrivateKey(keyValue)
      toast.success('Private key regenerated successfully!')
    }
    onClose()
  }, [keyValue, onClose, setProjectPrivateKey, RegeneratePrivateKey])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <AlertDialog onOpenChange={handleClose} open={isOpen}>
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            Regenerate Project Private Key
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            Regenerating the private key will re-encrypt all of your secrets
            with a new private key. If you think your existing private key has
            landed in the wrong hands, this is the best way to make sure you
            stay secure.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="p-4">
          <input
            className="w-full rounded-md border border-gray-300 bg-gray-800 p-2 text-white"
            onChange={(e) => setKeyValue(e.target.value)}
            placeholder="Enter key..."
            type="text"
            value={keyValue}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-md border border-[#F4F4F5] text-[#F4F4F5] hover:border-[#F4F4F5]/80"
            onClick={handleClose}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-md bg-[#F4F4F5] text-black hover:bg-[#F4F4F5]/80"
            onClick={handleSaveChanges}
          >
            Save Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default RegenerateKeyDialog
