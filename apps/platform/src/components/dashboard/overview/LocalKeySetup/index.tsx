import React, { useState } from 'react'
import { AddSVG, EyeOpenSVG, EyeSlashSVG, TrashSVG } from '@public/svg/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  const [isRevealed, setIsRevealed] = useState<boolean>(false)

  const handleToggleReveal = () => setIsRevealed((prev) => !prev)

  if (privateKey && !isStoredOnServer) {
    return (
      <div className="flex gap-1">
        <Input
          className="bg-[#26282C] px-4 py-6"
          readOnly
          type="text"
          value={
            isRevealed
              ? privateKey
              : privateKey.replace(/./g, '*').substring(0, 20)
          }
        />
        <Button
          className="flex items-center justify-center px-4 py-6"
          onClick={handleToggleReveal}
          type="button"
        >
          {isRevealed ? <EyeSlashSVG /> : <EyeOpenSVG />}
        </Button>
        <Button
          className="flex items-center justify-center px-4 py-6"
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
    >
      <AddSVG />
      <div className="font-bold">Setup Private Key</div>
    </Button>
  )
}

export default LocalKeySetup
