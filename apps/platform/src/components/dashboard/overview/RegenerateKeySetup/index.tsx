import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useSetAtom } from 'jotai'
import { Info } from 'lucide-react'
import { RegenerateSVG } from '@public/svg/shared'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'
import { selectedProjectPrivateKeyAtom } from '@/store'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

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
    <div className="flex justify-between gap-1.5 rounded-lg bg-white/5 p-3">
      <div>
        <h1 className="text-sm font-medium text-white">
          Do you wanna regenerate private key?{' '}
          <Tooltip>
            <TooltipTrigger>
              <Info className="ml-1 inline h-5 w-5 text-white/70" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-52 bg-white/10 text-center text-sm text-black">
                This will generate a new private key and replace the old one.
              </p>
            </TooltipContent>
          </Tooltip>
        </h1>
      </div>
      <Button
        className="flex w-fit items-center gap-2 rounded-md bg-neutral-800 px-3 py-5 text-sm text-white/70"
        onClick={handleRegenerate}
        type="button"
        variant="default"
      >
        <RegenerateSVG />
        <div className="font-bold">Regenerate Key</div>
      </Button>
    </div>
  )
}

export default RegenerateKeySetup
