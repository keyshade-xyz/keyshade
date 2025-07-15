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
import {
  privateKeyStorageTypeAtom,
  selectedProjectPrivateKeyAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Input } from '@/components/ui/input'

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
  const setPrivateKeyStorageType = useSetAtom(privateKeyStorageTypeAtom)

  const SavePrivateKey = useHttp((key: string) =>
    ControllerInstance.getInstance().projectController.updateProject({
      projectSlug: currentProjectSlug,
      privateKey: key,
      storePrivateKey: true
    })
  )

  const handleSaveChanges = useCallback(async () => {
    const response = await SavePrivateKey(keyValue)
    if (!response.error) {
      setProjectPrivateKey(keyValue)
      toast.success('Key saved successfully!')
    }
    setPrivateKeyStorageType('IN_DB')
    onClose()
  }, [
    keyValue,
    onClose,
    setProjectPrivateKey,
    SavePrivateKey,
    setPrivateKeyStorageType
  ])

  return (
    <AlertDialog onOpenChange={onClose} open={isOpen}>
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#1E1E1F]">
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

export default ServerKeySetupDialog
