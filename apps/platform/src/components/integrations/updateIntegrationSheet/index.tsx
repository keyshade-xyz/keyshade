'use client'
import React, { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { useAtom, useAtomValue } from 'jotai'
import type { IntegrationTypeEnum } from '@keyshade/schema'
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
import type { EventType } from '@/components/integrations/eventTriggers'
import EventTriggersInput from '@/components/integrations/eventTriggers'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { editIntegrationOpenAtom, selectedIntegrationAtom } from '@/store'

function UpdateIntegration() {
  const [isEditIntegrationOpen, setIsEditIntegrationOpen] = useAtom(
    editIntegrationOpenAtom
  )
  const selectedIntegration = useAtomValue(selectedIntegrationAtom)

  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<EventType[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(
    null
  )
  const [metadata, setMetadata] = useState<Record<string, string>>({})

  // Load initial data when selectedIntegration changes
  useEffect(() => {
    if (selectedIntegration) {
      setName(selectedIntegration.name || '')
      setSelectedEvents(selectedIntegration.notifyOn as EventType[])
      setMetadata(selectedIntegration.metadata)

      if (selectedIntegration.project) {
        setSelectedProject(selectedIntegration.project.slug)
      }

      if (selectedIntegration.environment) {
        setSelectedEnvironment(selectedIntegration.environment.slug)
      }
    }
  }, [selectedIntegration])

  const updateIntegration = useHttp(() => {
    return ControllerInstance.getInstance().integrationController.updateIntegration(
      {
        integrationSlug: selectedIntegration!.slug,
        name,
        type: selectedIntegration!.type,
        notifyOn: selectedEvents,
        metadata,
        ...(selectedProject ? { projectSlug: selectedProject } : {}),
        ...(selectedEnvironment ? { environmentSlug: selectedEnvironment } : {})
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
      if (selectedEvents.length === 0) {
        toast.error('Select at least one event type')
        return
      }

      setIsLoading(true)

      try {
        const { success, data } = await updateIntegration()

        if (success && data) {
          toast.success(`Integration updated successfully!`)
          setIsEditIntegrationOpen(false)
        }
      } catch (err) {
        toast.error('There was a problem updating the integration.')
      } finally {
        setIsLoading(false)
      }
    },
    [name, selectedEvents, updateIntegration, setIsEditIntegrationOpen]
  )

  const handleCancel = () => {
    setIsEditIntegrationOpen(false)
  }

  if (!selectedIntegration) return null

  const integrationType = selectedIntegration.type as IntegrationTypeEnum

  return (
    <Sheet
      onOpenChange={() => {
        setIsEditIntegrationOpen((prev) => !prev)
      }}
      open={isEditIntegrationOpen}
    >
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
            onChange={setSelectedEvents}
            selectedEvents={selectedEvents}
          />

          {/* Setup integration metadata */}
          <IntegrationMetadata
            initialMetadata={metadata}
            integrationType={integrationType.toLowerCase()}
            onChange={setMetadata}
          />

          {/* Specify Project and Environment(optional) */}
          <ProjectEnvironmentInput
            initialEnvironment={selectedIntegration.environment}
            initialProject={selectedIntegration.project}
            onEnvironmentChange={setSelectedEnvironment}
            onProjectChange={setSelectedProject}
          />

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
