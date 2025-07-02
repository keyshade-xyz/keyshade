import React from 'react'
import { toast } from 'sonner'
import { TrashSVG } from '@public/svg/shared'
import { Info, Plus } from 'lucide-react'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'
import { HiddenContent } from '@/components/shared/dashboard/hidden-content'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

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
    <div className="flex justify-between gap-1.5 rounded-lg bg-white/10 p-3">
      <div>
        <h1 className="text-lg font-medium text-white">
          Share project private key with us?{' '}
          <Tooltip>
            <TooltipTrigger>
              <Info className="ml-1 inline h-5 w-5 text-white/70" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-52 bg-white/10 text-center text-sm text-black">
                This will help you and your team to shared secrets easily.
              </p>
            </TooltipContent>
          </Tooltip>
        </h1>
      </div>
      <Button
        className="flex w-fit items-center gap-1 rounded-md bg-neutral-800 px-3 py-5 text-sm text-white/70"
        onClick={handleStorePrivateKey}
        type="button"
        variant="default"
      >
        <Plus />
        Store Private Key
      </Button>
    </div>
  )
}

export default ServerKeySetup
