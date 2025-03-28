import { RegenerateSVG } from '@public/svg/shared'
import React from 'react'
import { toast } from 'sonner'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'

interface RegenerateKeyProps {
  projectSlug: string
  privateKey: string | null
  onOpenRegenerateDialog: () => void
}

function RegenerateKeySetup({
  projectSlug,
  privateKey,
  onOpenRegenerateDialog
}: RegenerateKeyProps) {
  const regenerateKey = useHttp((key: string) =>
    ControllerInstance.getInstance().projectController.updateProject({
      projectSlug,
      regenerateKeyPair: true,
      privateKey: key
    })
  )

  const handleClick = async () => {
    if (privateKey) {
      const response = await regenerateKey(privateKey)
      if (!response.error) {
        toast.success('Key regenerated successfully!')
      }
    } else {
      onOpenRegenerateDialog()
    }
  }

  return (
    <button
      className="flex w-[12rem] items-center justify-center gap-[10px] rounded-[8px] border border-black/30 bg-black/20 p-[16px]"
      onClick={handleClick}
      type="button"
    >
      <RegenerateSVG />
      <div className="text-[14px] font-[700]">Regenerate Key</div>
    </button>
  )
}

export default RegenerateKeySetup
