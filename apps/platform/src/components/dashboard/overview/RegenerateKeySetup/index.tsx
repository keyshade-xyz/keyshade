import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useSetAtom } from 'jotai'
import { RegenerateSVG } from '@public/svg/shared'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'
import { selectedProjectPrivateKeyAtom } from '@/store'

interface RegenerateKeyProps {
  projectSlug: string
  privateKey: string | null
  onOpenRegenerateDialog: () => void
  onRegenerated: (keys: {
    projectName: string
    storePrivateKey: boolean
    keys: { publicKey: string; privateKey: string }
  }) => void
}

function RegenerateKeySetup({
  projectSlug,
  privateKey,
  onOpenRegenerateDialog,
  onRegenerated
}: RegenerateKeyProps) {
  const setPrivateKey = useSetAtom(selectedProjectPrivateKeyAtom)
  const [projectKeys, setProjectKeys] = useState<{
    projectName: string
    storePrivateKey: boolean
    keys: { publicKey: string; privateKey: string }
  }>()

  const regenerateKey = useHttp((key: string) =>
    ControllerInstance.getInstance().projectController.updateProject({
      projectSlug,
      regenerateKeyPair: true,
      privateKey: key
    })
  )

  const handleRegenerate = async () => {
    if (privateKey) {
      const { data, success } = await regenerateKey(privateKey)
      if (success && data) {
        setProjectKeys({
          projectName: data.name,
          storePrivateKey: data.storePrivateKey,
          keys: {
            publicKey: data.publicKey,
            privateKey: data.privateKey
          }
        })
        setPrivateKey(data.privateKey)
        toast.success('Key regenerated successfully!')
      }
    } else {
      onOpenRegenerateDialog()
    }
  }
  useEffect(() => {
    if (projectKeys) {
      onRegenerated(projectKeys)
    }
  }, [projectKeys, onRegenerated])

  return (
    <Button
      className="flex w-fit items-center justify-center gap-2 px-6 py-6"
      onClick={handleRegenerate}
      type="button"
      variant="secondary"
    >
      <RegenerateSVG />
      <div className="font-bold">Regenerate Key</div>
    </Button>
  )
}

export default RegenerateKeySetup
