import React from 'react'
import { toast } from 'sonner'
import { TrashSVG } from '@public/svg/shared'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'
import { HiddenContent } from '@/components/shared/dashboard/hidden-content'

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

  if (privateKey && isStoredOnServer) {
    return (
      <div className="flex justify-between gap-1">
        <HiddenContent isPrivateKey value={privateKey} />
        <Button
          className="flex items-center justify-center bg-neutral-800 p-2"
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
