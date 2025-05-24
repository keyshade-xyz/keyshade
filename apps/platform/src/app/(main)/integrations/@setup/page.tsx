'use client'
import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useAtomValue } from 'jotai'
import type { IntegrationTypeEnum } from '@keyshade/schema'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ProjectEnvironmentInput from '@/components/integrations/projectEnvironmentInput'
import IntegrationForm from '@/components/integrations/integrationMetadata'
import type { EventType } from '@/components/integrations/eventTriggers'
import EventTriggersInput from '@/components/integrations/eventTriggers'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { selectedWorkspaceAtom } from '@/store'

interface SetupIntegrationProps {
  setupType: string
}

export default function SetupIntegration({ setupType }: SetupIntegrationProps) {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<EventType[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(
    null
  )
  const [metadata, setMetadata] = useState<Record<string, string>>({})
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)

  const integrationType = setupType.toUpperCase() as IntegrationTypeEnum

  const router = useRouter()

  const createIntegration = useHttp(() =>
    ControllerInstance.getInstance().integrationController.createIntegration({
      name,
      type: integrationType,
      metadata,
      workspaceSlug: selectedWorkspace!.slug,
      notifyOn: selectedEvents,
      ...(selectedProject ? { projectSlug: selectedProject } : {}),
      ...(selectedEnvironment ? { environmentSlug: selectedEnvironment } : {})
    })
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!name.trim()) {
        toast.error('Name of integration is required')
        return
      }
      if (selectedEvents.length === 0) {
        toast.error('Select at least one event type')
        return
      }

      setIsLoading(true)

      try {
        const { success, data } = await createIntegration()

        if (success && data) {
          toast.success(`${setupType} integration created!`)
          setName('')
          setSelectedEvents([])
        }
      } catch (err) {
        toast.error('There was a problem setting up the integration.')
      } finally {
        setIsLoading(false)
        router.push('/integrations')
      }
    },
    [name, selectedEvents, setupType, createIntegration, router]
  )

  return (
    <div className="mr-auto max-w-7xl p-6 text-white">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-3xl font-bold">
          Integrate {setupType} with Keyshade
        </h2>
      </div>

      <p className="mb-6 text-white/60">
        Connect your environment with {setupType} to automate workflows and keep
        your systems in sync.
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
          onChange={setSelectedEvents}
          selectedEvents={selectedEvents}
        />

        {/* Setup integration metadata */}
        <IntegrationForm
          initialMetadata={metadata}
          integrationType={setupType}
          onChange={setMetadata}
        />

        {/* Specify Project and Environment(optional) */}
        <ProjectEnvironmentInput
          onEnvironmentChange={setSelectedEnvironment}
          onProjectChange={setSelectedProject}
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
