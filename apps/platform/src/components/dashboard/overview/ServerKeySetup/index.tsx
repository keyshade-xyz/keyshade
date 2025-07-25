import React from 'react'
import { toast } from 'sonner'
import { Info, Plus } from 'lucide-react'
import { useAtom } from 'jotai'
import { TrashSVG } from '@public/svg/shared'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'
import { HiddenContent } from '@/components/shared/dashboard/hidden-content'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { privateKeyStorageTypeAtom } from '@/store'

interface ServerKeySetupProps {
  privateKey: string | null
  projectSlug: string
  onOpenStoreDialog: () => void
  onDelete: () => void
}

function ServerKeySetup({
  privateKey,
  projectSlug,
  onOpenStoreDialog,
  onDelete
}: ServerKeySetupProps): React.JSX.Element {
  const [privateKeyStorageType, setPrivateKeyStorageType] = useAtom(
    privateKeyStorageTypeAtom
  )

  const isPrivateKeyStoredDB = privateKeyStorageType === 'IN_DB'

  const updatePrivateKey = useHttp((key: string) =>
    ControllerInstance.getInstance().projectController.updateProject({
      projectSlug,
      storePrivateKey: true,
      privateKey: key
    })
  )

  const handleStorePrivateKey = async () => {
    if (isPrivateKeyStoredDB) {
      const response = await updatePrivateKey(privateKey!)
      if (!response.error) {
        setPrivateKeyStorageType('IN_DB')
        toast.success('Private Key stored successfully!')
      }
    } else {
      onOpenStoreDialog()
    }
  }

  return (
    <div
      className={`flex justify-between gap-2 rounded-lg bg-white/10 p-3 ${isPrivateKeyStoredDB && 'flex-col gap-3'}`}
    >
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
      {isPrivateKeyStoredDB ? (
        <div className="flex items-center justify-between gap-1">
          <HiddenContent isPrivateKey value={privateKey!} />
          <Button
            className="flex items-center justify-center bg-neutral-800 p-2"
            onClick={onDelete}
            type="button"
          >
            <TrashSVG />
          </Button>
        </div>
      ) : (
        <Button
          className="flex w-fit items-center gap-1 rounded-md bg-neutral-800 px-3 py-5 text-sm text-white/70"
          onClick={handleStorePrivateKey}
          type="button"
          variant="default"
        >
          <Plus />
          Store Private Key
        </Button>
      )}
    </div>
  )
}

export default ServerKeySetup
