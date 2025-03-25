import { RegenerateSVG } from '@public/svg/shared'
import React from 'react'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'

interface RegenerateKeyProps {
  projectSlug: string
}

function RegenerateKey({ projectSlug }: RegenerateKeyProps) {
  const regenerateKey = useHttp(() =>
    ControllerInstance.getInstance().projectController.updateProject({
      projectSlug,
      regenerateKeyPair: true,
      privateKey: '' //Need to change the logic later
    })
  )

  return (
    <button
      className="flex w-[12rem] items-center justify-center gap-[10px] rounded-[8px] border border-black/30 bg-black/20 p-[16px]"
      onClick={() => regenerateKey()}
      type="button"
    >
      <RegenerateSVG />
      <div className="text-[14px] font-[700]">Regenerate Key</div>
    </button>
  )
}

export default RegenerateKey
