import React, { useState } from 'react'
import { EyeOpenSVG, EyeSlashSVG, TrashSVG } from '@public/svg/shared'
import { toast } from 'sonner'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ServerKeySetupProps {
  privateKey: string | null
  isStoredOnServer: boolean
  projectSlug: string
  onOpenStoreDialog: () => void
  onDelete: () => void
  onKeyStored: () => void
}

function ServerKeySetup({
  privateKey,
  isStoredOnServer,
  projectSlug,
  onOpenStoreDialog,
  onDelete,
  onKeyStored
}: ServerKeySetupProps): React.JSX.Element {
  const [isRevealed, setIsRevealed] = useState<boolean>(false)

  const updatePrivateKey = useHttp((key: string) =>
    ControllerInstance.getInstance().projectController.updateProject({
      projectSlug,
      storePrivateKey: true,
      privateKey: key
    })
  )

  const handleStorePrivateKey = async () => {
    if (privateKey && !isStoredOnServer) {
      const response = await updatePrivateKey(privateKey)
      if (!response.error) {
        onKeyStored()
        toast.success('Private Key stored successfully!')
      }
    } else {
      onOpenStoreDialog()
    }
  }

  const handleToggleReveal = () => setIsRevealed((prev) => !prev)

  if (privateKey && isStoredOnServer) {
    return (
      <div className="flex gap-1">
        <Input
          className="px-4 py-6"
          readOnly
          type="text"
          value={
            isRevealed
              ? privateKey
              : privateKey.replace(/./g, '*').substring(0, 20)
          }
        />
        <Button
          className="flex items-center justify-center bg-neutral-800 px-4 py-6"
          onClick={handleToggleReveal}
          type="button"
        >
          {isRevealed ? <EyeSlashSVG /> : <EyeOpenSVG />}
        </Button>
        <Button
          className="flex items-center justify-center bg-neutral-800 px-4 py-6"
          onClick={onDelete}
          type="button"
        >
          <TrashSVG />
        </Button>
      </div>
    )
  }
  return (
    <Button
      className="w-fit px-8 py-6 font-bold"
      onClick={handleStorePrivateKey}
      type="button"
      variant="secondary"
    >
      Store Private Key
    </Button>
  )
}

export default ServerKeySetup
