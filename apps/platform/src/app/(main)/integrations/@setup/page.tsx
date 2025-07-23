'use client'
import React from 'react'
import type { IntegrationTypeEnum } from '@keyshade/schema'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ProjectEnvironmentInput from '@/components/integrations/projectEnvironmentInput'
import ProjectEnvironmentMapping from '@/components/integrations/ProjectEnvironmentMapping'
import IntegrationForm from '@/components/integrations/integrationMetadata'
import EventTriggersInput from '@/components/integrations/eventTriggers'
import { useSetupIntegration } from '@/hooks/use-integration'

interface SetupIntegrationProps {
  integrationType: IntegrationTypeEnum
  integrationName: string
}

export default function SetupIntegration({
  integrationType,
  integrationName
}: SetupIntegrationProps) {
  const {
    formState,
    isLoading,
    config,
    projectPrivateKey,
    privateKeyLoading,
    handlers
  } = useSetupIntegration(integrationType, integrationName)

  return (
    <div className="mr-auto max-w-7xl p-6 text-white">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-3xl font-bold">
          Integrate {integrationName} with Keyshade
        </h2>
      </div>

      <p className="mb-6 text-white/60">
        Connect your environment with {integrationName} to automate workflows
        and keep your systems in sync.
      </p>

      <form className="flex flex-col gap-6" onSubmit={handlers.handleSubmit}>
        {/* Integration Name */}
        <div>
          <label
            className="mb-2 block font-medium text-white"
            htmlFor="integration-name"
          >
            Integration Name
          </label>
          <Input
            id="integration-name"
            onChange={(e) => handlers.handleNameChange(e.currentTarget.value)}
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
        <IntegrationForm
          initialMetadata={formState.metadata}
          integrationName={integrationName}
          integrationType={integrationType}
          onChange={handlers.handleMetadataChange}
        />

        {/* Project and Environment Selection */}
        {config.isMappingRequired ? (
          <ProjectEnvironmentMapping
            keyMapping={formState.mappings}
            manualPrivateKey={formState.manualPrivateKey}
            onEnvironmentChange={handlers.handleEnvironmentChange}
            onKeyMappingChange={handlers.handleMappingsChange}
            onManualPrivateKeyChange={handlers.handleManualPrivateKeyChange}
            onProjectChange={handlers.handleProjectChange}
            privateKeyLoading={privateKeyLoading}
            projectPrivateKey={projectPrivateKey}
            selectedProject={formState.selectedProject}
          />
        ) : (
          <ProjectEnvironmentInput
            isMultiEnvironment={config.maxEnvironmentsCount === 'any'}
            manualPrivateKey={formState.manualPrivateKey}
            onEnvironmentChange={handlers.handleEnvironmentChange}
            onManualPrivateKeyChange={handlers.handleManualPrivateKeyChange}
            onProjectChange={handlers.handleProjectChange}
            privateKeyLoading={privateKeyLoading}
            privateKeyRequired={config.isPrivateKeyRequired}
            projectPrivateKey={projectPrivateKey}
            selectedProject={formState.selectedProject}
          />
        )}

        {/* Submit Button */}
        <Button
          className="self-end"
          disabled={isLoading}
          type="submit"
          variant="secondary"
        >
          {isLoading ? 'Creating...' : 'Create Integration'}
        </Button>
      </form>
    </div>
  )
}
