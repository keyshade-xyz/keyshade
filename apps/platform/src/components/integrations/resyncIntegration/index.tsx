import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

function ResyncIntegration() {
  return (
    <div className="p flex w-full items-center rounded-lg border border-white/10 bg-white/5 p-4  backdrop-blur-sm">
      <div className="mr-4 flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-white">Re-Sync</h2>
        <p className="text-sm text-white/60">
          Instantly synchronize all secrets and variables between Keyshade and
          your connected platform.
        </p>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button disabled variant="secondary">
              Sync Now
            </Button>
          </TooltipTrigger>
          <TooltipContent
            className="z-10 w-28 border-transparent bg-white/20 text-white"
            sideOffset={10}
          >
            <p className="text-sm text-white/90">
              This feature is not available yet.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export default ResyncIntegration
