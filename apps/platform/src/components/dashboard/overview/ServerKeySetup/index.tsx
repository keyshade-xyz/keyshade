import React, { useState } from 'react'
import { EyeOpenSVG, EyeSlashSVG } from '@public/svg/shared'
import { toast } from 'sonner'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'

interface ServerKeySetupProps {
  privateKey: string | null
  isStoredOnServer: boolean
  projectSlug: string
  onOpenStoreDialog: () => void
}

function ServerKeySetup({
  privateKey,
  isStoredOnServer,
  projectSlug,
  onOpenStoreDialog
}: ServerKeySetupProps): React.JSX.Element {
  const [isRevealed, setIsRevealed] = useState<boolean>(false)

  const updatePrivateKey = useHttp((key: string) =>
    ControllerInstance.getInstance().projectController.updateProject({
      projectSlug,
      regenerateKeyPair: true,
      privateKey: key
    })
  )

  const handleStorePrivateKey = async () => {
    if (privateKey && !isStoredOnServer) {
      const response = await updatePrivateKey(privateKey)
      if (!response.error) {
        toast.success('Private Key stored successfully!')
      }
    } else {
      onOpenStoreDialog()
    }
  }

  const handleToggleReveal = () => setIsRevealed((prev) => !prev)

  if (privateKey && isStoredOnServer) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="flex w-full items-center rounded-lg border border-black/30 bg-black/20 p-4">
            <span className="w-full break-all text-sm font-bold">
              {isRevealed
                ? privateKey
                : privateKey.replace(/./g, '*').substring(0, 20)}
            </span>
          </div>
          <button
            className="flex items-center justify-center rounded-lg border border-black/30 bg-black/20 p-4 duration-300 hover:scale-105"
            onClick={handleToggleReveal}
            type="button"
          >
            {isRevealed ? <EyeSlashSVG /> : <EyeOpenSVG />}
          </button>
        </div>
      </div>
    )
  }
  return (
    <Button
      className="w-fit px-4 py-6"
      onClick={handleStorePrivateKey}
      type="button"
    >
      Store Private Key
    </Button>
  )
}

export default ServerKeySetup
