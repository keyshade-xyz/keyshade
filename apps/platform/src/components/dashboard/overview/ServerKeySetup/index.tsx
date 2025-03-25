import React, { useState } from 'react'
import { EyeOpenSVG, EyeSlashSVG, TickCircleSVG } from '@public/svg/shared'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'

interface ServerKeySetupProps {
  privateKey: string | null
  isStoredOnServer: boolean
  projectSlug: string
}

function ServerKeySetup({
  privateKey,
  isStoredOnServer,
  projectSlug
}: ServerKeySetupProps): React.JSX.Element {
  const [isRevealed, setIsRevealed] = useState<boolean>(false)

  const updatePrivateKey = useHttp((key: string) =>
    ControllerInstance.getInstance().projectController.updateProject({
      projectSlug,
      regenerateKeyPair: true,
      privateKey: key
    })
  )

  const handleStorePrivateKey = async () => {
    if (privateKey) {
      await updatePrivateKey(privateKey)
    }
  }

  const handleToggleReveal = () => setIsRevealed((prev) => !prev)

  if (privateKey && isStoredOnServer) {
    return (
      <div className="flex flex-col gap-4">
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
        <div className="flex gap-2">
          <div className="flex w-[8rem] items-center justify-center gap-[10px] rounded-[8px] border border-black/30 bg-black/20 p-[16px] text-white/50">
            <TickCircleSVG />
            <div className="text-[14px] font-[700]">Stored</div>
          </div>
          <button
            className="flex w-[8rem] items-center justify-center gap-[10px] rounded-[8px] bg-[#DC2626] p-[16px] text-white"
            type="button"
          >
            <div className="text-[14px] font-[700]">Remove Key</div>
          </button>
        </div>
      </div>
    )
  }
  return (
    <button
      className="flex w-[12rem] cursor-pointer items-center justify-center rounded-[8px] border border-black/30 bg-black/20 p-[16px] text-[14px] font-[700] text-white"
      onClick={handleStorePrivateKey}
      type="button"
    >
      Store Private Key
    </button>
  )
}

export default ServerKeySetup
