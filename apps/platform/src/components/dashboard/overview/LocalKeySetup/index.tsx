import React from 'react'
import { Info, Plus } from 'lucide-react'
import { TrashSVG } from '@public/svg/shared'
import { Button } from '@/components/ui/button'
import { HiddenContent } from '@/components/shared/dashboard/hidden-content'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

interface LocalKeySetupProps {
  privateKey: string | null
  isStoredOnServer: boolean
  onOpenSetupDialog: () => void
  onDelete: () => void
}

function LocalKeySetup({
  privateKey,
  isStoredOnServer,
  onOpenSetupDialog,
  onDelete
}: LocalKeySetupProps): React.JSX.Element {
  if (privateKey && !isStoredOnServer) {
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
          Do you wanna setup private key?{' '}
          <Tooltip>
            <TooltipTrigger>
              <Info className="ml-1 inline h-5 w-5 text-white/70" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-52 bg-white/10 text-center text-sm text-black">
                Settings up your private key in browser helps you with safely
                setting up your secret.
              </p>
            </TooltipContent>
          </Tooltip>
        </h1>
      </div>
      <Button
        className="flex w-fit items-center gap-1 rounded-md bg-neutral-800 px-3 py-5 text-sm text-white/70"
        disabled={Boolean(privateKey !== null && isStoredOnServer)}
        onClick={onOpenSetupDialog}
        type="button"
        variant="default"
      >
        <Plus />
        <div className="font-bold">Setup Private Key</div>
      </Button>
    </div>
  )
}

export default LocalKeySetup
