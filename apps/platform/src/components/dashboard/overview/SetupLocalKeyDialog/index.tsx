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
import { setKeyLocally } from '@/lib/utils'

interface SetupLocalKeyDialogProps {
  isOpen: boolean
  onClose: () => void
  currentProject: string
}

function SetupLocalKeyDialog({
  isOpen,
  onClose,
  currentProject
}: SetupLocalKeyDialogProps): React.JSX.Element {
  const [keyValue, setKeyValue] = useState<string>('')
  const setProjectPrivateKey = useSetAtom(selectedProjectPrivateKeyAtom)

  const handleSaveChanges = useCallback(() => {
    setProjectPrivateKey(keyValue)
    setKeyLocally(`${currentProject}_pk`, keyValue)
    toast.success('Key saved successfully!')
    onClose()
  }, [keyValue, onClose, setProjectPrivateKey, currentProject])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <AlertDialog onOpenChange={handleClose} open={isOpen}>
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">
            Setup Private Key Locally
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-gray-400">
            Enter your key below to save it on browser to safely setting up you
            secret.
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
            className="textwhite/60 rounded-md border border-white/60 hover:border-white/80"
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

export default SetupLocalKeyDialog
