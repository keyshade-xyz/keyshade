import React from 'react'
import { Plus } from 'lucide-react'
import { TrashSVG } from '@public/svg/shared'
import { Button } from '@/components/ui/button'
import { HiddenContent } from '@/components/shared/dashboard/hidden-content'

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
    <Button
      className="w-fit px-4 py-6 flex items-center gap-1"
      disabled={Boolean(privateKey !== null && isStoredOnServer)}
      onClick={onOpenSetupDialog}
      type="button"
      variant="secondary"
    >
      <Plus />
      <div className="font-bold">Setup Private Key</div>
    </Button>
  )
}

export default LocalKeySetup
