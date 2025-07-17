import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { VercelEnvironmentMapping } from '@keyshade/common'
import { Integrations } from '@keyshade/common'
import type { EventTypeEnum, IntegrationTypeEnum } from '@keyshade/schema'
import { useHttp } from '@/hooks/use-http'
import { useProjectPrivateKey } from '@/hooks/use-fetch-privatekey'
import ControllerInstance from '@/lib/controller-instance'
import {
  selectedWorkspaceAtom,
  integrationFormAtom,
  integrationLoadingAtom,
  resetIntegrationFormAtom
} from '@/store'

export function useSetupIntegration(
  integrationType: IntegrationTypeEnum,
  integrationName: string
) {
  const [formState, setFormState] = useAtom(integrationFormAtom)
  const [isLoading, setIsLoading] = useAtom(integrationLoadingAtom)
  const resetForm = useSetAtom(resetIntegrationFormAtom)
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const router = useRouter()

  const config = Integrations[integrationType]
  const { projectPrivateKey, loading: privateKeyLoading } =
    useProjectPrivateKey(formState.selectedProject)

  // Fetch project details when project slug changes
  const getProjectDetails = useHttp((projectSlug: string) =>
    ControllerInstance.getInstance().projectController.getProject({
      projectSlug
    })
  )

  useEffect(() => {
    if (!formState.selectedProjectSlug) {
      setFormState((prev) => ({
        ...prev,
        selectedProject: null,
        manualPrivateKey: ''
      }))
      return
    }

    getProjectDetails(formState.selectedProjectSlug).then(
      ({ data, success }) => {
        if (success && data) {
          setFormState((prev) => ({
            ...prev,
            selectedProject: {
              slug: data.slug,
              storePrivateKey: data.storePrivateKey,
              privateKey: data.privateKey
            }
          }))
        }
      }
    )
  }, [formState.selectedProjectSlug, getProjectDetails, setFormState])

  const validateForm = useCallback(() => {
    if (
      config.privateKeyRequired &&
      formState.selectedEnvironments.length === 0
    ) {
      toast.error('Environment is required for this integration')
      return false
    }

    if (
      formState.selectedProjectSlug &&
      config.privateKeyRequired &&
      !projectPrivateKey &&
      !formState.manualPrivateKey.trim()
    ) {
      toast.error('Project private key is required')
      return false
    }

    return true
  }, [formState, config, projectPrivateKey])

  const createIntegration = useHttp(() => {
    const finalMetadata = config.envMapping
      ? { ...formState.metadata, environments: formState.mappings }
      : formState.metadata

    const privateKeyToUse =
      projectPrivateKey || formState.manualPrivateKey || undefined

    return ControllerInstance.getInstance().integrationController.createIntegration(
      {
        name: formState.name,
        type: integrationType.toUpperCase() as IntegrationTypeEnum,
        metadata: finalMetadata as Record<string, string>,
        workspaceSlug: selectedWorkspace!.slug,
        notifyOn: Array.from(formState.selectedEvents),
        projectSlug: formState.selectedProjectSlug ?? undefined,
        environmentSlugs: formState.selectedEnvironments,
        privateKey: privateKeyToUse
      }
    )
  })

  // Event handlers - simplified with direct atom updates
  const handlers = {
    handleNameChange: useCallback(
      (name: string) => {
        setFormState((prev) => ({ ...prev, name }))
      },
      [setFormState]
    ),

    handleEventsChange: useCallback(
      (selectedEvents: Set<EventTypeEnum>) => {
        setFormState((prev) => ({ ...prev, selectedEvents }))
      },
      [setFormState]
    ),

    handleMetadataChange: useCallback(
      (metadata: Record<string, unknown>) => {
        setFormState((prev) => ({ ...prev, metadata }))
      },
      [setFormState]
    ),

    handleProjectChange: useCallback(
      (projectSlug: string | null) => {
        setFormState((prev) => ({
          ...prev,
          selectedProjectSlug: projectSlug,
          selectedEnvironments: []
        }))
      },
      [setFormState]
    ),

    handleEnvironmentChange: useCallback(
      (environmentSlugs: string[]) => {
        setFormState((prev) => ({
          ...prev,
          selectedEnvironments: environmentSlugs
        }))
      },
      [setFormState]
    ),

    handleMappingsChange: useCallback(
      (mappings: VercelEnvironmentMapping) => {
        setFormState((prev) => ({ ...prev, mappings }))
      },
      [setFormState]
    ),

    handleManualPrivateKeyChange: useCallback(
      (manualPrivateKey: string) => {
        setFormState((prev) => ({ ...prev, manualPrivateKey }))
      },
      [setFormState]
    ),

    handleSubmit: useCallback(
      async (e: React.FormEvent): Promise<boolean> => {
        e.preventDefault()

        if (!validateForm()) return false

        setIsLoading(true)

        try {
          const { success, data } = await createIntegration()
          if (success && data) {
            toast.success(
              `${integrationName} integration created successfully!`
            )
            resetForm()
            router.push('/integrations?tab=all')
            return true
          }
          return false
        } catch (error) {
          toast.error('Failed to create integration. Please try again.')
          return false
        } finally {
          setIsLoading(false)
        }
      },
      [
        validateForm,
        createIntegration,
        integrationName,
        resetForm,
        router,
        setIsLoading
      ]
    )
  }

  return {
    formState,
    isLoading,
    config: {
      isMappingRequired: config.envMapping || false,
      isPrivateKeyRequired: config.privateKeyRequired || false,
      maxEnvironmentsCount: config.maxEnvironmentsCount || 'any'
    },
    projectPrivateKey,
    privateKeyLoading,
    handlers
  }
}
