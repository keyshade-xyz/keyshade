import { RegenerateSVG } from '@public/svg/shared'
import React from 'react'
import { toast } from 'sonner'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'

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
    <Button
      className="flex w-fit items-center justify-center gap-2 px-4 py-6"
      onClick={handleClick}
      type="button"
    >
      <RegenerateSVG />
      <div className="font-bold">Regenerate Key</div>
    </Button>
  )
}

export default RegenerateKeySetup
