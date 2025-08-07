"use client"
import React, { useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { ArrowLeftRight, CheckSquare2 } from 'lucide-react'
import { Integrations } from '@keyshade/common'
import { KeyshadeBigSVG } from '@public/svg/auth'
import IntegrationIcon from '../integrationIcon'
import SetupIntegration from '../integrationSetup'
import { formatText } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createIntegrationTypeAtom, createIntegrationOpenAtom } from '@/store'
function CreateIntegration(): React.JSX.Element {
  const integrationType = useAtomValue(createIntegrationTypeAtom)
  const setCreateIntegrationModalOpen = useSetAtom(createIntegrationOpenAtom)
  const [setupModalOpen, setSetupModalOpen] = useState<boolean>(false)
}
  if (!integrationType) {
    return (
      <div className="text-center text-gray-500">No integration selected</div>
    )
  }
  const integrationName = formatText(integrationType)
  const integrationConfig = Integrations[integrationType]
  const integrationPermissions =
    integrationConfig.events?.map(
      (group) => `Get notified about ${group.name.toLowerCase()}`
    ) || []
  const handleNext = () => {
    setSetupModalOpen(true)
  }
  const handleHowItWorks = () => {
    const url = `https://docs.keyshade.xyz/integrations/platforms/set-up-with-${integrationType.toLowerCase()}`
    window.location.href = url
  }
  const handleSetupOpenChange = (open: boolean) => {
    setSetupModalOpen(open)
    if (!open) {
      setCreateIntegrationModalOpen(false)
    }
  }
  return (
    <div>
      <Dialog onOpenChange={handleSetupOpenChange} open={!setupModalOpen}>
        <DialogContent className="max-w-md bg-[#18181B] text-white">
          <DialogHeader className="flex flex-col items-center justify-between gap-5 pb-4">
            <div className="flex w-full items-center justify-center gap-3">
              <div className="rounded-xl bg-white/10 p-2">
                <KeyshadeBigSVG height="55" viewBox="0 0 130 120" width="55" />
              </div>
              <ArrowLeftRight className="h-6 w-6" />
              <IntegrationIcon
                className="h-[4.5rem] w-[4.5rem] p-4"
                type={integrationType}
              />
            </div>
            <DialogTitle>
              <div className="flex flex-col items-center justify-center text-center">
                <h2 className="mb-2 text-xl font-semibold">
                  Integrate Keyshade with {integrationName}
                </h2>
                <p className="text-sm text-gray-400">
                  Connect Keyshade with {integrationName} to send real-time
                  project updates directly to your server.
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3 border-y border-white/20 py-4">
              <h3 className="text-sm font-medium">Keyshade would do</h3>
              <div className="space-y-2">
                {integrationPermissions.map((permission) => (
                  <div className="flex items-center gap-2" key={permission}>
                    <CheckSquare2 className="h-4 w-4" />
                    <span className="text-sm text-white/60">{permission}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <Button onClick={handleHowItWorks} variant="secondary">
                How it works
              </Button>
              <Button onClick={handleNext} variant="secondary">
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <SetupIntegration
        integrationName={integrationName}
        integrationType={integrationType}
        onOpenChange={handleSetupOpenChange}
        open={setupModalOpen}
      />
    </div>
  )
}
export default CreateIntegration
