import React from 'react'
import { AddSVG, TrashSVG } from '@public/svg/shared'
import { Button } from '@/components/ui/button'
import HiddenContent from '@/components/shared/dashboard/hidden-content'


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
      <div className="flex flex-col gap-3">
        <HiddenContent text={privateKey} />
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
      className="w-fit px-4 py-6"
      disabled={Boolean(privateKey !== null && isStoredOnServer)}
      onClick={onOpenSetupDialog}
      type="button"
      variant="secondary"
    >
      <AddSVG />
      <div className="font-bold">Setup Private Key</div>
    </Button>
  )
}

export default LocalKeySetup
