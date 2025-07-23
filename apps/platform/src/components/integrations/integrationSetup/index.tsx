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
import Visible from '@/components/common/visible'

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
  enum Step {
    IntegrationSetupStep,
    ProjectEnvironmentStep
  }

  const [currentStep, setCurrentStep] = useState<Step>(
    Step.IntegrationSetupStep
  )

  const {
    formState,
    isLoading,
    config,
    projectPrivateKey,
    privateKeyLoading,
    handlers
  } = useSetupIntegration(integrationType, integrationName)

  const handleNext = () => {
    const isNameEmpty = formState.name.trim() === ''
    const noEventsSelected = formState.selectedEvents.size === 0
    const isMetadataMissing = Object.keys(formState.metadata).length === 0
    const hasEmptyMetadataValues = Object.values(formState.metadata).some(
      (value) =>
        (typeof value === 'string' && value.trim() === '') ||
        (typeof value === 'object' &&
          value !== null &&
          Object.keys(value).length === 0)
    )

    if (isNameEmpty) {
      toast.error('Integration name is required')
      return
    }
    if (noEventsSelected) {
      toast.error('At least one event must be selected')
      return
    }
    if (isMetadataMissing) {
      toast.error('Integration metadata is required')
      return
    }
    if (hasEmptyMetadataValues) {
      toast.error('All configuration fields are required')
      return
    }

    setCurrentStep(Step.ProjectEnvironmentStep)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await handlers.handleSubmit(e)

    if (success) {
      onOpenChange?.(false)
      setCurrentStep(Step.IntegrationSetupStep)
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
          <Visible if={currentStep === Step.IntegrationSetupStep}>
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
          </Visible>

          <Visible if={currentStep === Step.ProjectEnvironmentStep}>
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
          </Visible>
        </div>

        <div className="flex w-full justify-between border-t border-white/20 pt-4">
          <Button variant="secondary">Need Help?</Button>

          <Visible if={currentStep === Step.IntegrationSetupStep}>
            <Button onClick={handleNext} type="button" variant="secondary">
              Continue
            </Button>
          </Visible>

          <Visible if={currentStep === Step.ProjectEnvironmentStep}>
            <Button
              disabled={isLoading}
              onClick={handleSubmit}
              variant="secondary"
            >
              {isLoading ? 'Creating...' : 'Create Integration'}
            </Button>
          </Visible>
        </div>
      </DialogContent>
    </Dialog>
  )
}
