'use client'
import React, { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { useAtomValue } from 'jotai'
import type {
  Environment,
  EventTypeEnum,
  Integration,
  IntegrationTypeEnum,
  Project,
  ProjectWithTierLimitAndCount
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
import { useProjectPrivateKey } from '@/hooks/use-fetch-privatekey'
import ControllerInstance from '@/lib/controller-instance'
import { selectedWorkspaceAtom } from '@/store'

interface SetupIntegrationProps {
  integrationType: IntegrationTypeEnum
  integrationName: string
}

type PartialProject = Pick<
  ProjectWithTierLimitAndCount,
  'slug' | 'storePrivateKey' | 'privateKey'
>

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
  const [selectedProject, setSelectedProject] = useState<PartialProject | null>(
    null
  )
  const [selectedEnvironments, setSelectedEnvironments] = useState<
    Environment['slug'][]
  >([])
  const [metadata, setMetadata] = useState<Record<string, unknown>>({})
  const [mappings, setMappings] = useState<VercelEnvironmentMapping>({})
  const [manualPrivateKey, setManualPrivateKey] = useState<string>('')

  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)

  const { projectPrivateKey, loading: privateKeyLoading } =
    useProjectPrivateKey(selectedProject)

  const router = useRouter()
  const isMappingRequired = Integrations[integrationType].envMapping

  // Fetch project details when project slug changes
  const getProjectDetails = useHttp((projectSlug: string) =>
    ControllerInstance.getInstance().projectController.getProject({
      projectSlug
    })
  )

  useEffect(() => {
    if (selectedProjectSlug) {
      getProjectDetails(selectedProjectSlug).then(({ data, success }) => {
        if (success && data) {
          setSelectedProject({
            slug: data.slug,
            storePrivateKey: data.storePrivateKey,
            privateKey: data.privateKey
          })
        }
      })
    } else {
      setSelectedProject(null)
      setManualPrivateKey('')
    }
  }, [selectedProjectSlug, getProjectDetails])

  const createIntegration = useHttp(() => {
    const finalMetadata = isMappingRequired
      ? {
          ...metadata,
          environments: mappings
        }
      : metadata

    // Determine which private key to use
    const privateKeyToUse = projectPrivateKey || manualPrivateKey || undefined

    return ControllerInstance.getInstance().integrationController.createIntegration(
      {
        name,
        type: integrationType.toUpperCase() as IntegrationTypeEnum,
        metadata: finalMetadata as Record<string, string>,
        workspaceSlug: selectedWorkspace!.slug,
        notifyOn: Array.from(selectedEvents),
        projectSlug: selectedProjectSlug ?? undefined,
        environmentSlugs: selectedEnvironments,
        privateKey: privateKeyToUse
      }
    )
  })

  const resetFormData = () => {
    setName('')
    setSelectedEvents(new Set())
    setSelectedProjectSlug(null)
    setSelectedProject(null)
    setSelectedEnvironments([])
    setMetadata({})
    setMappings({})
    setManualPrivateKey('')
  }

  const handleProjectChange = (projectSlug: Project['slug'] | null) => {
    setSelectedProjectSlug(projectSlug)
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!name.trim()) {
        toast.error('Name of integration is required')
        return
      }

      // Check if project is selected but no private key is available
      if (
        selectedProjectSlug &&
        Integrations[integrationType].privateKeyRequired &&
        !projectPrivateKey &&
        !manualPrivateKey.trim()
      ) {
        toast.error('Project private key is required for this integration')
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
    [
      name,
      createIntegration,
      integrationName,
      integrationType,
      router,
      selectedProjectSlug,
      projectPrivateKey,
      manualPrivateKey
    ]
  )

  selectedProject && !privateKeyLoading && !projectPrivateKey

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
            manualPrivateKey={manualPrivateKey}
            onEnvironmentChange={setSelectedEnvironments}
            onKeyMappingChange={setMappings}
            onManualPrivateKeyChange={setManualPrivateKey}
            onProjectChange={handleProjectChange}
            privateKeyLoading={privateKeyLoading}
            projectPrivateKey={projectPrivateKey}
            selectedProject={selectedProject}
          />
        ) : (
          <ProjectEnvironmentInput
            onEnvironmentChange={setSelectedEnvironments}
            onProjectChange={handleProjectChange}
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
