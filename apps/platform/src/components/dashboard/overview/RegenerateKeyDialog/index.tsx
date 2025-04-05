import React, { useCallback, useState } from 'react'
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
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Input } from '@/components/ui/input'

interface RegenerateKeyDialogProps {
  isOpen: boolean
  onClose: () => void
  currentProjectSlug: string
  onRegenerated: (keys: {
    projectName: string
    storePrivateKey: boolean
    keys: { publicKey: string; privateKey: string }
  }) => void
}

function RegenerateKeyDialog({
  isOpen,
  onClose,
  currentProjectSlug,
  onRegenerated
}: RegenerateKeyDialogProps): React.JSX.Element {
  const [keyValue, setKeyValue] = useState<string>('')

  const RegeneratePrivateKey = useHttp((key: string) =>
    ControllerInstance.getInstance().projectController.updateProject({
      projectSlug: currentProjectSlug,
      regenerateKeyPair: true,
      privateKey: key
    })
  )

  const handleSaveChanges = useCallback(async () => {
    if (!keyValue) {
      toast.error('Please enter your current private key first.')
      return
    }
    const { data, success } = await RegeneratePrivateKey(keyValue)
    if (success && data) {
      const newKeys = {
        projectName: data.name,
        storePrivateKey: data.storePrivateKey,
        keys: {
          publicKey: data.publicKey,
          privateKey: data.privateKey
        }
      }
      onRegenerated(newKeys)
      toast.success('Key regenerated successfully!')
      onClose()
    }
  }, [keyValue, onClose, RegeneratePrivateKey, onRegenerated])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <AlertDialog onOpenChange={handleClose} open={isOpen}>
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#1E1E1F]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">
            Regenerate Project Private Key
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-gray-400">
            Regenerating the private key will re-encrypt all of your secrets
            with a new private key. If you think your existing private key has
            landed in the wrong hands, this is the best way to make sure you
            stay secure.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          onChange={(e) => setKeyValue(e.target.value)}
          placeholder="Enter your private key"
          value={keyValue}
        />
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-md border border-white/60 text-white/80"
            onClick={handleClose}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-md bg-white/80 text-black hover:bg-white/60"
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
