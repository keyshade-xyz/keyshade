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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ProjectEnvironmentInput from '@/components/integrations/projectEnvironmentInput'
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
  const [selectedEnvironment, setSelectedEnvironment] = useState<
    Environment['slug'] | null
  >(null)
  const [metadata, setMetadata] = useState<Record<string, string>>({})
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)

  const router = useRouter()

  const createIntegration = useHttp(() =>
    ControllerInstance.getInstance().integrationController.createIntegration({
      name,
      type: integrationType.toUpperCase() as IntegrationTypeEnum,
      metadata,
      workspaceSlug: selectedWorkspace!.slug,
      notifyOn: Array.from(selectedEvents),
      projectSlug: selectedProjectSlug ?? undefined,
      environmentSlug: selectedEnvironment ?? undefined
    })
  )

  const resetFormData = () => {
    setName('')
    setSelectedEvents(new Set())
    setSelectedProjectSlug(null)
    setSelectedEnvironment(null)
    setMetadata({})
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!name.trim()) {
        toast.error('Name of integration is required')
        return
      }

      setIsLoading(true)

      try {
        const { success, data } = await createIntegration()

        if (success && data) {
          toast.success(`${integrationName} integration created!`)
          resetFormData()
        }
      } finally {
        setIsLoading(false)
        router.push('/integrations')
      }
    },
    [name, createIntegration, integrationName, router]
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
        <ProjectEnvironmentInput
          onEnvironmentChange={setSelectedEnvironment}
          onProjectChange={setSelectedProjectSlug}
        />

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
