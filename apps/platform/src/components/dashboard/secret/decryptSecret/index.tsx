'use client'
import { useAtom, useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { InfoSVG } from '@public/svg/shared'
import { shouldRevealSecretEnabled, selectedProjectAtom } from '@/store'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

export default function DecryptSecret(): React.JSX.Element {
  const [revealSecretOpen, setRevealSecretOpen] = useAtom(
    shouldRevealSecretEnabled
  )
  const selectedProject = useAtomValue(selectedProjectAtom)

  const isPrivateKeyStored = useMemo(
    () => selectedProject?.storePrivateKey === true || false,
    [selectedProject]
  )

  return (
    <div>
      {isPrivateKeyStored ? (
        <div className="flex items-center gap-x-2">
          <Switch
            checked={revealSecretOpen}
            id="reveal-secret-switch"
            onCheckedChange={setRevealSecretOpen}
          />
          <label
            className="cursor-pointer text-sm"
            htmlFor="reveal-secret-switch"
          >
            Retrieve plaintext secrets
          </label>
        </div>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <InfoSVG />
            </TooltipTrigger>
            <TooltipContent
              className="w-[12rem] rounded-[6px] border-none bg-white/10 text-sm text-white"
              sideOffset={8}
            >
              You need to store the private key first in order to view the
              value.
              <TooltipArrow className="fill-white/10" />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
