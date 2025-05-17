'use client'
import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useAtomValue } from 'jotai'
import type { IntegrationTypeEnum } from '@keyshade/schema'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import ProjectEnvironmentInput from '@/components/integrations/projectEnvironmentInput'
import IntegrationForm from '@/components/integrations/integrationMetadata'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { selectedWorkspaceAtom } from '@/store'

/* eslint-disable @typescript-eslint/naming-convention -- allow UPPER_SNAKE_CASE for enum members */
enum EventType {
  INVITED_TO_WORKSPACE = 'INVITED_TO_WORKSPACE',
  REMOVED_FROM_WORKSPACE = 'REMOVED_FROM_WORKSPACE',
  ACCEPTED_INVITATION = 'ACCEPTED_INVITATION',
  DECLINED_INVITATION = 'DECLINED_INVITATION',
  CANCELLED_INVITATION = 'CANCELLED_INVITATION',
  LEFT_WORKSPACE = 'LEFT_WORKSPACE',
  WORKSPACE_UPDATED = 'WORKSPACE_UPDATED',
  WORKSPACE_CREATED = 'WORKSPACE_CREATED',
  WORKSPACE_ROLE_CREATED = 'WORKSPACE_ROLE_CREATED',
  WORKSPACE_ROLE_UPDATED = 'WORKSPACE_ROLE_UPDATED',
  WORKSPACE_ROLE_DELETED = 'WORKSPACE_ROLE_DELETED',
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  SECRET_UPDATED = 'SECRET_UPDATED',
  SECRET_DELETED = 'SECRET_DELETED',
  SECRET_ADDED = 'SECRET_ADDED',
  VARIABLE_UPDATED = 'VARIABLE_UPDATED',
  VARIABLE_DELETED = 'VARIABLE_DELETED',
  VARIABLE_ADDED = 'VARIABLE_ADDED',
  ENVIRONMENT_UPDATED = 'ENVIRONMENT_UPDATED',
  ENVIRONMENT_DELETED = 'ENVIRONMENT_DELETED',
  ENVIRONMENT_ADDED = 'ENVIRONMENT_ADDED',
  INTEGRATION_ADDED = 'INTEGRATION_ADDED',
  INTEGRATION_UPDATED = 'INTEGRATION_UPDATED',
  INTEGRATION_DELETED = 'INTEGRATION_DELETED'
}
/* eslint-enable @typescript-eslint/naming-convention -- end exception for enum members */

const formatEventType = (eventType: string) => {
  return eventType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const getAllEvents = (): EventType[] => {
  return Object.values(EventType)
}

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
  const [showAllEvents, setShowAllEvents] = useState(false)
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)

  const allEvents = getAllEvents()
  const initialEventCount = 8
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

  const toggleEvent = (event: EventType) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  const selectAll = (select: boolean) => {
    if (select) {
      setSelectedEvents(getAllEvents())
    } else {
      setSelectedEvents([])
    }
  }

  const visibleEvents = showAllEvents
    ? allEvents
    : allEvents.slice(0, initialEventCount)
  const areAllSelected = allEvents.every((event) =>
    selectedEvents.includes(event)
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
            className=""
            id="integration-name"
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Name of Integration"
            value={name}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="font-medium text-white" htmlFor="select-events">
              Select Event Triggers
            </label>
            <span className="text-xs text-white/40">
              {selectedEvents.length} selected
            </span>
          </div>

          <div
            className="space-y-3 rounded-lg border border-white/10 bg-neutral-800 p-4"
            id="select-events"
          >
            <div className="mb-3 flex items-center space-x-3 border-b border-white/10 pb-3">
              <Checkbox
                checked={areAllSelected}
                className="rounded-[4px] border border-[#18181B] bg-[#71717A] text-black data-[state=checked]:border-[#18181B] data-[state=checked]:bg-white/90 data-[state=checked]:text-black"
                id="select-all"
                onCheckedChange={(checked) => selectAll(checked === true)}
              />
              <label
                className="cursor-pointer text-sm font-semibold text-slate-100"
                htmlFor="select-all"
              >
                Select All Events
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {visibleEvents.map((event) => (
                <div className="flex items-center space-x-3" key={event}>
                  <Checkbox
                    checked={selectedEvents.includes(event)}
                    className="rounded-[4px] border border-[#18181B] bg-[#71717A] text-black data-[state=checked]:border-[#18181B] data-[state=checked]:bg-white/90 data-[state=checked]:text-black"
                    id={event}
                    onCheckedChange={() => toggleEvent(event)}
                  />
                  <label
                    className="cursor-pointer text-sm font-medium leading-none text-slate-200"
                    htmlFor={event}
                  >
                    {formatEventType(event)}
                  </label>
                </div>
              ))}
            </div>

            {allEvents.length > initialEventCount && (
              <div className="flex w-full justify-end">
                <Button
                  className="text-white/50 hover:bg-transparent hover:text-white/60"
                  onClick={() => setShowAllEvents(!showAllEvents)}
                  type="button"
                  variant="ghost"
                >
                  {showAllEvents ? 'Show Less' : 'Show More'}
                </Button>
              </div>
            )}
          </div>
        </div>

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
