'use client'
import React, { useState } from 'react'
import type { IntegrationTypeEnum } from '@keyshade/schema'
import { toast } from 'sonner'
import ProjectEnvironmentInput from '../projectEnvironmentInput'
import ProjectEnvironmentSelect from '../projectEnvironmentSelect'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import IntegrationMetadata from '@/components/integrations/integrationMetadata'
import EventTriggersInput from '@/components/integrations/eventTriggers'
import { useSetupIntegration } from '@/hooks/use-integration'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface SetupIntegrationProps {
  integrationType: IntegrationTypeEnum
  integrationName: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function SetupIntegration({
  integrationType,
  integrationName,
  open,
  onOpenChange
}: SetupIntegrationProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const {
    formState,
    isLoading,
    config,
    projectPrivateKey,
    privateKeyLoading,
    handlers
  } = useSetupIntegration(integrationType, integrationName)

  const handleNext = () => {
    if (!formState.name.trim()) {
      toast.error('Integration name is required')
      return
    }
    if (formState.selectedEvents.size === 0) {
      toast.error('At least one event must be selected')
      return
    }
    if (Object.keys(formState.metadata).length === 0) {
      toast.error('Integration metadata is required')
      return
    }
    const hasEmptyValues = Object.values(formState.metadata).some((value) => {
      if (typeof value === 'string' && value.trim() === '') return true
      if (
        typeof value === 'object' &&
        value !== null &&
        Object.keys(value).length === 0
      )
        return true
      return false
    })

    if (hasEmptyValues) {
      toast.error('All configuration fields are required')
      return false
    }

    setCurrentStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await handlers.handleSubmit(e)

    if (success) {
      onOpenChange?.(false)
      setCurrentStep(1)
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto border-transparent bg-[#18181B]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Integrate {integrationName} with Keyshade
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-white/60">
            Configure Keyshade with {integrationName} to start tracking events
            and manage your projects
          </DialogDescription>
        </DialogHeader>

        <div className="border-t border-white/20">
          {currentStep === 1 && (
            <div className="flex flex-col gap-6 py-4">
              {/* Integration Name */}
              <div>
                <label
                  className="mb-2 block font-medium"
                  htmlFor="integration-name"
                >
                  Integration Name
                </label>
                <Input
                  id="integration-name"
                  onChange={(e) =>
                    handlers.handleNameChange(e.currentTarget.value)
                  }
                  placeholder="Name of Integration"
                  value={formState.name}
                />
              </div>

              {/* Event Triggers */}
              <EventTriggersInput
                integrationType={integrationType}
                onChange={handlers.handleEventsChange}
                selectedEvents={formState.selectedEvents}
              />

              {/* Integration Metadata */}
              <IntegrationMetadata
                integrationName={integrationName}
                integrationType={integrationType}
                onChange={handlers.handleMetadataChange}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col gap-6 py-4">
              {/* Project and Environment Selection */}
              {config.isPrivateKeyRequired ? (
                <ProjectEnvironmentSelect
                  isKeyMappingNeeded={config.isMappingRequired}
                  privateKeyLoading={privateKeyLoading}
                  projectPrivateKey={projectPrivateKey}
                />
              ) : (
                <ProjectEnvironmentInput
                  onEnvironmentChange={handlers.handleEnvironmentChange}
                  onProjectChange={handlers.handleProjectChange}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex w-full justify-between border-t border-white/20 pt-4">
          <Button variant="secondary">Need Help?</Button>

          {currentStep === 1 && (
            <Button onClick={handleNext} type="button" variant="secondary">
              Continue
            </Button>
          )}

          {currentStep === 2 && (
            <Button
              disabled={isLoading}
              onClick={handleSubmit}
              variant="secondary"
            >
              {isLoading ? 'Creating...' : 'Create Integration'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
