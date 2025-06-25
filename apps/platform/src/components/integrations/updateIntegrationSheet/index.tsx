'use client'
import React, { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { useAtom, useAtomValue } from 'jotai'
import type { EventTypeEnum } from '@keyshade/schema'
import type { VercelEnvironmentMapping } from '@keyshade/common'
import { Integrations } from '@keyshade/common'
import ProjectEnvironmentMapping from '../ProjectEnvironmentMapping'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '@/components/ui/sheet'
import ProjectEnvironmentInput from '@/components/integrations/projectEnvironmentInput'
import IntegrationMetadata from '@/components/integrations/integrationMetadata'
import EventTriggersInput from '@/components/integrations/eventTriggers'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { editIntegrationOpenAtom, selectedIntegrationAtom } from '@/store'

function UpdateIntegration({
  onUpdateSuccess
}: {
  onUpdateSuccess?: () => void
}) {
  const [isEditIntegrationOpen, setIsEditIntegrationOpen] = useAtom(
    editIntegrationOpenAtom
  )
  const selectedIntegration = useAtomValue(selectedIntegrationAtom)

  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<Set<EventTypeEnum>>(
    new Set()
  )
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([])
  const [envMappings, setEnvMappings] = useState<VercelEnvironmentMapping>({})
  const [metadata, setMetadata] = useState<Record<string, unknown>>({})

  const integrationType = selectedIntegration?.type
  const isMappingRequired = integrationType
    ? Integrations[integrationType].envMapping
    : false

  useEffect(() => {
    if (selectedIntegration) {
      setName(selectedIntegration.name || '')
      setSelectedEvents(new Set(selectedIntegration.notifyOn))
      setMetadata(selectedIntegration.metadata)

      if (selectedIntegration.project) {
        setSelectedProject(selectedIntegration.project.slug)
      }

      if (
        selectedIntegration.environments &&
        selectedIntegration.environments.length > 0
      ) {
        setSelectedEnvironments(
          selectedIntegration.environments.map((env) => env.slug)
        )
      }

      if (selectedIntegration.metadata.environments) {
        setEnvMappings(
          selectedIntegration.metadata
            .environments as unknown as VercelEnvironmentMapping
        )
      }
    }
  }, [selectedIntegration])

  const updateIntegration = useHttp((finalMetadata) => {
    return ControllerInstance.getInstance().integrationController.updateIntegration(
      {
        integrationSlug: selectedIntegration!.slug,
        name:
          name.trim() === selectedIntegration!.name ? undefined : name.trim(),
        type: selectedIntegration!.type,
        notifyOn: Array.from(selectedEvents),
        metadata: finalMetadata as Record<string, string>,
        ...(selectedProject ? { projectSlug: selectedProject } : {}),
        ...(selectedEnvironments.length > 0
          ? { environmentSlugs: selectedEnvironments }
          : {})
      }
    )
  })

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
            environments: envMappings
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
        const { success, data } = await updateIntegration(
          finalMetadata as Record<string, string>
        )

        if (success && data) {
          toast.success(`Integration updated successfully!`)
          setIsEditIntegrationOpen(false)
          onUpdateSuccess?.()
        }
      } finally {
        setIsLoading(false)
      }
    },
    [
      name,
      selectedEvents,
      updateIntegration,
      setIsEditIntegrationOpen,
      onUpdateSuccess,
      isMappingRequired,
      metadata,
      envMappings
    ]
  )

  const handleCancel = () => {
    setIsEditIntegrationOpen(false)
  }

  if (!selectedIntegration || !integrationType) return null

  return (
    <Sheet open={isEditIntegrationOpen}>
      <SheetContent className="min-w-[600px] overflow-y-auto border-white/15 bg-[#222425]">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl text-white">
            Update Integration
          </SheetTitle>
          <SheetDescription className="text-white/50">
            Modify your{' '}
            <span className="font-bold">{selectedIntegration.name}</span>{' '}
            integration settings
          </SheetDescription>
        </SheetHeader>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-2 block font-medium"
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

          <IntegrationMetadata
            initialMetadata={metadata}
            integrationType={integrationType}
            onChange={setMetadata}
          />

          {/* Specify Project and Environment(optional) */}
          {isMappingRequired ? (
            <ProjectEnvironmentMapping
              initialEnvironments={selectedIntegration.environments}
              initialProject={selectedIntegration.project}
              keyMapping={envMappings}
              onEnvironmentChange={setSelectedEnvironments}
              onKeyMappingChange={setEnvMappings}
              onProjectChange={setSelectedProject}
            />
          ) : (
            <ProjectEnvironmentInput
              initialEnvironments={selectedIntegration.environments}
              initialProject={selectedIntegration.project}
              onEnvironmentChange={setSelectedEnvironments}
              onProjectChange={setSelectedProject}
            />
          )}

          <SheetFooter className="flex justify-end gap-3 pt-4">
            <Button onClick={handleCancel} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isLoading} type="submit" variant="secondary">
              {isLoading ? 'Updating...' : 'Update Integration'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default UpdateIntegration
