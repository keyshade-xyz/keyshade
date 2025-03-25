import { AddSVG, EyeOpenSVG, EyeSlashSVG } from '@public/svg/shared'
import React, { useState } from 'react'

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
        <div className="flex items-center justify-center rounded-[8px] border border-[#93C5FD] p-[10px]">
          <p className="text-[16px] font-[400] text-[#93C5FD]">
            We are using your private key from the browser.
          </p>
        </div>

        <div className="flex gap-2">
          <div
            className={`flex ${
              isRevealed ? 'w-[20rem]' : 'w-[16rem]'
            } items-center rounded-[8px] border border-black/30 bg-black/20 p-[16px]`}
          >
            <span className="w-full break-all text-[14px] font-[700]">
              {isRevealed
                ? privateKey
                : privateKey.replace(/./g, '*').substring(0, 20)}
            </span>
          </div>
          <button
            className="flex items-center justify-center rounded-[8px] border border-black/30 bg-black/20 p-[16px] duration-300 hover:scale-105"
            onClick={handleToggleReveal}
            type="button"
          >
            {isRevealed ? <EyeSlashSVG /> : <EyeOpenSVG />}
          </button>
        </div>
      </div>
    )
  }

  if (privateKey && isStoredOnServer) {
    return (
      <button
        className="flex w-[12rem] cursor-not-allowed items-center justify-center gap-[10px] rounded-[8px] border border-black/30 bg-black/20 p-[16px] text-white/50"
        disabled
        type="button"
      >
        <AddSVG />
        <div className="text-[14px] font-[700]">Setup Private Key</div>
      </button>
    )
  }

  return (
    <button
      className="flex w-[12rem] items-center justify-center gap-[10px] rounded-[8px] border border-black/30 bg-black/20 p-[16px] hover:bg-black/30"
      onClick={onOpenSetupDialog}
      type="button"
    >
      <AddSVG />
      <div className="text-[14px] font-[700]">Setup Private Key</div>
    </button>
  )
}

export default LocalKeySetup
