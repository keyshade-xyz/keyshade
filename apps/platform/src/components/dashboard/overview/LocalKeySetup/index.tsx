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
      className="flex w-fit items-center gap-1 rounded-md bg-neutral-800 px-4 py-6 text-sm text-white/70"
      disabled={Boolean(privateKey !== null && isStoredOnServer)}
      onClick={onOpenSetupDialog}
      type="button"
      variant="default"
    >
      <Plus />
      <div className="font-bold">Setup Private Key</div>
    </Button>
  )
}

export default LocalKeySetup
