import React, { useState } from 'react'
import { AddSVG, EyeOpenSVG, EyeSlashSVG } from '@public/svg/shared'
import { Button } from '@/components/ui/button'

interface LocalKeySetupProps {
  privateKey: string | null
  isStoredOnServer: boolean
  onOpenSetupDialog: () => void
}

function LocalKeySetup({
  privateKey,
  isStoredOnServer,
  onOpenSetupDialog
}: LocalKeySetupProps): React.JSX.Element {
  const [isRevealed, setIsRevealed] = useState<boolean>(false)

  const handleToggleReveal = () => setIsRevealed((prev) => !prev)

  if (privateKey && !isStoredOnServer) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center rounded-lg border border-[#93C5FD] p-[10px]">
          <p className="text-[16px] font-[400] text-[#93C5FD]">
            We are using your private key from the browser.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex w-full items-center rounded-[8px] border border-black/30 bg-black/20 p-[16px]">
            <span className="w-full break-all text-[14px] font-[700]">
              {isRevealed
                ? privateKey
                : privateKey.replace(/./g, '*').substring(0, 20)}
            </span>
          </div>
          <button
            className="flex items-center justify-center rounded-[8px] border border-black/30 bg-black/20 px-4 py-2 duration-300 hover:scale-105"
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
      disabled={Boolean(privateKey !== null && isStoredOnServer)}
      onClick={onOpenSetupDialog}
      type="button"
    >
      <AddSVG />
      <div className="font-semibold">Setup Private Key</div>
    </Button>
  )
}

export default LocalKeySetup
