'use client'
import React from 'react'
import type { IntegrationTypeEnum } from '@keyshade/schema'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import IntegrationForm from '@/components/integrations/integrationMetadata'
import EventTriggersInput from '@/components/integrations/eventTriggers'
import { useSetupIntegrationContext } from '@/components/contexts/setup-integration-context'

interface BasicInfoStepProps {
  integrationType: IntegrationTypeEnum
  integrationName: string
  open?: boolean
  onCancel: () => void
}

export default function BasicInfoStep({
  integrationType,
  integrationName,
  open,
  onCancel
}: BasicInfoStepProps) {
  const { formState, handlers } = useSetupIntegrationContext()

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    handlers.handleNextStep()
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto border-transparent bg-[#18181B]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold">
            Setup {integrationName} Integration
          </AlertDialogTitle>
          <AlertDialogDescription>
            Configure the basic settings for your {integrationName} integration.
            This includes naming your integration, selecting events, and setting
            up configuration.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form className="flex flex-col gap-6 py-4" onSubmit={handleNext}>
          {/* Integration Name */}
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor="integration-name"
            >
              Integration Name
            </label>
            <Input
              className="w-full"
              id="integration-name"
              onChange={(e) => handlers.handleNameChange(e.currentTarget.value)}
              placeholder="Enter a descriptive name for this integration"
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
          <IntegrationForm
            integrationName={integrationName}
            integrationType={integrationType}
            onChange={handlers.handleMetadataChange}
          />
        </form>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleNext}>Next</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
