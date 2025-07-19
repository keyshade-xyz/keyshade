'use client'
import React, { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { useAtom } from 'jotai'
import type { EventTypeEnum } from '@keyshade/schema'
import type { VercelEnvironmentMapping } from '@keyshade/common'
import { Integrations } from '@keyshade/common'
import ProjectEnvironmentInput from '../projectEnvironmentInput'
import UpdateKeyMapping from '../updateKeymapping'
import UpdateEnvironment from '../updateEnvironment'
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
  const [selectedIntegration, setSelectedIntegration] = useAtom(
    selectedIntegrationAtom
  )

  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<Set<EventTypeEnum>>(
    new Set()
  )
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([])
  const [envMappings, setEnvMappings] = useState<VercelEnvironmentMapping>({})
  const [metadata, setMetadata] = useState<Record<string, unknown>>({})
  const integrationType = selectedIntegration?.type
  const isMappingRequired = integrationType
    ? Integrations[integrationType].envMapping
    : false
  const isPrivateKeyRequired = integrationType
    ? Integrations[integrationType].privateKeyRequired
    : false

  useEffect(() => {
    if (selectedIntegration) {
      setName(selectedIntegration.name || '')
      setSelectedEvents(new Set(selectedIntegration.notifyOn))
      setMetadata(selectedIntegration.metadata)

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
        notifyOn: Array.from(selectedEvents),
        metadata: finalMetadata as Record<string, string>,
        ...(selectedEnvironments.length > 0
          ? { environmentSlugs: selectedEnvironments }
          : {})
      }
    )
  })

  const testIntegration = useHttp((finalMetadata) => {
    return ControllerInstance.getInstance().integrationController.validateIntegrationConfiguration(
      {
        isCreate: false,
        integrationSlug: selectedIntegration!.slug,
        name: name.trim(),
        notifyOn: Array.from(selectedEvents),
        metadata: finalMetadata as Record<string, string>,
        ...(selectedEnvironments.length > 0
          ? { environmentSlugs: selectedEnvironments }
          : {})
      }
    )
  })

  // extracted shared validation & metadata logic:
  const prepareMetadata = useCallback(() => {
    if (!name.trim()) {
      toast.error('Name of integration is required')
      return null
    }
    if (selectedEvents.size === 0) {
      toast.error('At least one event trigger is required')
      return null
    }

    const finalMetadata = isMappingRequired
      ? { ...metadata, environments: envMappings }
      : metadata

    if (Object.keys(finalMetadata).length === 0) {
      toast.error('Configuration metadata is required')
      return null
    }

    const isEmptyValue = (value: unknown): boolean => {
      if (typeof value === 'string' && value.trim() === '') return true
      if (
        typeof value === 'object' &&
        value !== null &&
        Object.keys(value).length === 0
      )
        return true
      return false
    }

    const hasEmptyValues = Object.values(finalMetadata).some(isEmptyValue)
    if (hasEmptyValues) {
      toast.error('All configuration fields are required and cannot be empty')
      return null
    }

    return finalMetadata
  }, [name, selectedEvents, metadata, envMappings, isMappingRequired])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const finalMetadata = prepareMetadata()
      if (!finalMetadata) return

      setIsLoading(true)

      try {
        const { success, data } = await updateIntegration(
          finalMetadata as Record<string, string>
        )

        if (success && data) {
          toast.success(`Integration updated successfully!`)
          setSelectedIntegration(data)
          setIsEditIntegrationOpen(false)
          onUpdateSuccess?.()
        }
      } finally {
        setIsLoading(false)
      }
    },
    [
      updateIntegration,
      setIsEditIntegrationOpen,
      onUpdateSuccess,
      setSelectedIntegration,
      prepareMetadata
    ]
  )

  const handleTesting = useCallback(async () => {
    const finalMetadata = prepareMetadata()
    if (!finalMetadata) return

    setIsTesting(true)
    try {
      const { success, error } = await testIntegration(
        finalMetadata as Record<string, string>
      )
      if (success) {
        toast.success('Test event sent successfully!')
      } else {
        let errorMsg = 'Test failed. Please check your configuration.'
        if (error?.message) {
          try {
            const parsed = JSON.parse(error.message)
            if (parsed.header && parsed.body) {
              errorMsg = `${parsed.header}: ${parsed.body}`
            } else {
              errorMsg = error.message
            }
          } catch {
            errorMsg = error.message
          }
        }
        toast.error(errorMsg)
      }
    } catch {
      toast.error('An error occurred while testing.')
    } finally {
      setIsTesting(false)
    }
  }, [prepareMetadata, testIntegration])

  const handleCancel = () => {
    setIsEditIntegrationOpen(false)
  }

  const handleEnvironmentChange = (environmentSlugs: string[]) => {
    setSelectedEnvironments(environmentSlugs)
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
            integrationName={selectedIntegration.name}
            integrationType={integrationType}
            onChange={setMetadata}
          />

          {/* Specify Project and Environment(optional) */}
          {isPrivateKeyRequired ? (
            isMappingRequired ? (
              <UpdateKeyMapping
                initialEnvironments={selectedIntegration.environments!}
                initialMapping={envMappings}
                initialProject={selectedIntegration.project!}
                onEnvSlugsChange={handleEnvironmentChange}
                onMappingChange={setEnvMappings}
              />
            ) : (
              <UpdateEnvironment
                initialEnvironments={selectedIntegration.environments!}
                initialProject={selectedIntegration.project!}
                onEnvironmentChange={handleEnvironmentChange}
              />
            )
          ) : (
            <ProjectEnvironmentInput
              initialEnvironments={
                selectedIntegration.environments ?? undefined
              }
              initialProject={selectedIntegration.project}
              isMultiEnvironment={
                (selectedIntegration.environments?.length ?? 0) > 1
              }
              isProjectDisabled
              onEnvironmentChange={handleEnvironmentChange}
            />
          )}

          <SheetFooter className="flex justify-end gap-3 pt-4">
            <Button
              disabled={isLoading || isTesting}
              onClick={handleTesting}
              type="button"
              variant="default"
            >
              {isTesting ? 'Testing...' : 'Test Configuration'}
            </Button>
            <Button onClick={handleCancel} type="button" variant="outline">
              Cancel
            </Button>
            <Button
              disabled={isLoading || isTesting}
              type="submit"
              variant="secondary"
            >
              {isLoading ? 'Updating...' : 'Update Integration'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default UpdateIntegration
