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
      <TooltipProvider>
        <div className="flex items-center justify-center gap-4">
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-x-2">
                <Switch
                  checked={revealSecretOpen}
                  disabled={!isPrivateKeyStored}
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
            </TooltipTrigger>
            <TooltipContent
              className="w-[14rem] rounded-md border-none bg-white/10 text-sm text-white"
              side="left"
              sideOffset={8}
            >
              Uses your private key to decrypt your secrets on the fly, reducing
              the stress on your browser
              <TooltipArrow className="fill-white/10" />
            </TooltipContent>
          </Tooltip>
          {!isPrivateKeyStored && (
            <Tooltip>
              <TooltipTrigger>
                <InfoSVG />
              </TooltipTrigger>
              <TooltipContent
                className="w-[12rem] rounded-[6px] border-none bg-white/10 text-sm text-yellow-300"
                sideOffset={8}
              >
                you have not stored the private key with us
                <TooltipArrow className="fill-white/10" />
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </div>
  )
}
