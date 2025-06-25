'use client'
import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useAtomValue } from 'jotai'
import type {
  Environment,
  EventTypeEnum,
  Integration,
  IntegrationTypeEnum,
  Project
} from '@keyshade/schema'
import { useRouter } from 'next/navigation'
import type { VercelEnvironmentMapping } from '@keyshade/common'
import { Integrations } from '@keyshade/common'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ProjectEnvironmentInput from '@/components/integrations/projectEnvironmentInput'
import ProjectEnvironmentMapping from '@/components/integrations/ProjectEnvironmentMapping'
import IntegrationForm from '@/components/integrations/integrationMetadata'
import EventTriggersInput from '@/components/integrations/eventTriggers'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { selectedWorkspaceAtom } from '@/store'

interface SetupIntegrationProps {
  integrationType: IntegrationTypeEnum
  integrationName: string
}

export default function SetupIntegration({
  integrationType,
  integrationName
}: SetupIntegrationProps) {
  const [name, setName] = useState<Integration['name']>('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<Set<EventTypeEnum>>(
    new Set()
  )
  const [selectedProjectSlug, setSelectedProjectSlug] = useState<
    Project['slug'] | null
  >(null)
  const [selectedEnvironments, setSelectedEnvironments] = useState<
    Environment['slug'][]
  >([])
  const [metadata, setMetadata] = useState<Record<string, unknown>>({})
  const [mappings, setMappings] = useState<VercelEnvironmentMapping>({})
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)

  const router = useRouter()
  const isMappingRequired = Integrations[integrationType].envMapping

  const createIntegration = useHttp((finalMetadata) => {
    return ControllerInstance.getInstance().integrationController.createIntegration(
      {
        name,
        type: integrationType.toUpperCase() as IntegrationTypeEnum,
        metadata: finalMetadata as Record<string, string>,
        workspaceSlug: selectedWorkspace!.slug,
        notifyOn: Array.from(selectedEvents),
        projectSlug: selectedProjectSlug ?? undefined,
        environmentSlugs: selectedEnvironments
      }
    )
  })

  const resetFormData = () => {
    setName('')
    setSelectedEvents(new Set())
    setSelectedProjectSlug(null)
    setSelectedEnvironments([])
    setMetadata({})
    setMappings({})
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!name.trim()) {
        toast.error('Name of integration is required')
        return
      }
      if (selectedEvents.size === 0) {
        toast.error('At least one event trigger is required')
        return
      }

      const finalMetadata = isMappingRequired
        ? {
            ...metadata,
            environments: mappings
          }
        : metadata

      if (Object.keys(finalMetadata).length === 0) {
        toast.error('Configuration metadata is required')
        return
      }

      const isEmptyValue = (value: unknown): boolean => {
        if (typeof value === 'string' && value.trim() === '') {
          return true
        }

        if (
          typeof value === 'object' &&
          value !== null &&
          Object.keys(value).length === 0
        ) {
          return true
        }
        return false
      }

      const hasEmptyValues = Object.values(finalMetadata).some(isEmptyValue)

      if (hasEmptyValues) {
        toast.error('All configuration fields are required and cannot be empty')
        return
      }
      setIsLoading(true)

      try {
        const { success, data } = await createIntegration(
          finalMetadata as Record<string, string>
        )

        if (success && data) {
          toast.success(`${integrationName} integration created!`)
          resetFormData()
          router.push('/integrations')
        }
      } finally {
        setIsLoading(false)
      }
    },
    [
      name,
      createIntegration,
      integrationName,
      router,
      selectedEvents,
      metadata,
      mappings,
      isMappingRequired
    ]
  )

  return (
    <div className="mr-auto max-w-7xl p-6 text-white">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-3xl font-bold">
          Integrate {integrationName} with Keyshade
        </h2>
      </div>

      <p className="mb-6 text-white/60">
        Connect your environment with {integrationType} to automate workflows
        and keep your systems in sync.
      </p>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-2 block font-medium text-white"
            htmlFor="integration-name"
          >
            Integration Name
          </label>
          <Input
            id="integration-name"
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Name of Integration"
            value={name}
          />
        </div>

        {/* Event Triggers Input Component */}
        <EventTriggersInput
          integrationType={integrationType}
          onChange={setSelectedEvents}
          selectedEvents={selectedEvents}
        />

        {/* Setup integration metadata */}
        <IntegrationForm
          initialMetadata={metadata}
          integrationType={integrationType}
          onChange={setMetadata}
        />

        {/* Specify Project and Environment(optional) */}
        {isMappingRequired ? (
          <ProjectEnvironmentMapping
            keyMapping={mappings}
            onEnvironmentChange={setSelectedEnvironments}
            onKeyMappingChange={setMappings}
            onProjectChange={setSelectedProjectSlug}
          />
        ) : (
          <ProjectEnvironmentInput
            onEnvironmentChange={setSelectedEnvironments}
            onProjectChange={setSelectedProjectSlug}
          />
        )}

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
