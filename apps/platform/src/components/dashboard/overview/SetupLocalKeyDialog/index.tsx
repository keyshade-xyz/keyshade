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
import { localProjectPrivateKeyAtom, privateKeyStorageTypeAtom } from '@/store'
import { Input } from '@/components/ui/input'

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
  const setLocalProjectPrivateKey = useSetAtom(localProjectPrivateKeyAtom)
  const setPrivateKeyStorageType = useSetAtom(privateKeyStorageTypeAtom)

  const handleSaveChanges = useCallback(() => {
    setLocalProjectPrivateKey((prevKeys) => {
      const filtered = prevKeys.filter((pair) => pair.slug !== currentProject)
      return [...filtered, { slug: currentProject, key: keyValue }]
    })
    toast.success('Key saved successfully!')
    onClose()
    setPrivateKeyStorageType('IN_ATOM')
  }, [
    keyValue,
    onClose,
    currentProject,
    setLocalProjectPrivateKey,
    setPrivateKeyStorageType
  ])

  return (
    <AlertDialog onOpenChange={onClose} open={isOpen}>
      <AlertDialogContent className="rounded-lg border border-white/20 bg-[#1E1E1F]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">
            Setup private key locally
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-gray-400">
            Enter your key below to save it on browser to safely setting up you
            secret.
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
            onClick={onClose}
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

export default SetupLocalKeyDialog
