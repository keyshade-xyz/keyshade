import { useState, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAtomValue } from 'jotai'
import { useRouter } from 'next/navigation'
import type {
  Environment,
  EventTypeEnum,
  Integration,
  IntegrationTypeEnum,
  Project,
  ProjectWithTierLimitAndCount
} from '@keyshade/schema'
import type { VercelEnvironmentMapping } from '@keyshade/common'
import { Integrations } from '@keyshade/common'
import { useHttp } from '@/hooks/use-http'
import { useProjectPrivateKey } from '@/hooks/use-fetch-privatekey'
import ControllerInstance from '@/lib/controller-instance'
import { selectedWorkspaceAtom } from '@/store'

type PartialProject = Pick<
  ProjectWithTierLimitAndCount,
  'slug' | 'storePrivateKey' | 'privateKey'
>

interface FormState {
  name: Integration['name']
  selectedEvents: Set<EventTypeEnum>
  selectedProjectSlug: Project['slug'] | null
  selectedProject: PartialProject | null
  selectedEnvironments: Environment['slug'][]
  metadata: Record<string, unknown>
  mappings: VercelEnvironmentMapping
  manualPrivateKey: string
}

const initialFormState: FormState = {
  name: '',
  selectedEvents: new Set(),
  selectedProjectSlug: null,
  selectedProject: null,
  selectedEnvironments: [],
  metadata: {},
  mappings: {},
  manualPrivateKey: ''
}

export function useSetupIntegration(
  integrationType: IntegrationTypeEnum,
  integrationName: string
) {
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const formStateRef = useRef<FormState>(formState)

  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const router = useRouter()
  const integrationConfig = Integrations[integrationType]
  const isMappingRequired = integrationConfig.envMapping
  const isPrivateKeyRequired = integrationConfig.privateKeyRequired
  const maxEnvironmentsCount = integrationConfig.maxEnvironmentsCount

  const { projectPrivateKey, loading: privateKeyLoading } =
    useProjectPrivateKey(formState.selectedProject)

  useEffect(() => {
    formStateRef.current = formState
  }, [formState])

  const getProjectDetails = useHttp((projectSlug: string) =>
    ControllerInstance.getInstance().projectController.getProject({
      projectSlug
    })
  )
  const createIntegration = useHttp(() => {
    const currentState = formStateRef.current
    const finalMetadata = isMappingRequired
      ? { ...currentState.metadata, environments: currentState.mappings }
      : currentState.metadata

    const privateKeyToUse =
      projectPrivateKey || currentState.manualPrivateKey || undefined

    return ControllerInstance.getInstance().integrationController.createIntegration(
      {
        name: currentState.name,
        type: integrationType.toUpperCase() as IntegrationTypeEnum,
        metadata: finalMetadata as Record<string, string>,
        workspaceSlug: selectedWorkspace!.slug,
        notifyOn: Array.from(currentState.selectedEvents),
        projectSlug: currentState.selectedProjectSlug ?? undefined,
        environmentSlugs: currentState.selectedEnvironments,
        privateKey: privateKeyToUse
      }
    )
  })

  const testIntegration = useHttp((finalMetadata: Record<string, string>) => {
    const state = formStateRef.current
    const privateKeyToUse =
      projectPrivateKey || state.manualPrivateKey || undefined

    return ControllerInstance.getInstance().integrationController.validateIntegrationConfiguration(
      {
        isCreate: true,
        type: integrationType.toUpperCase() as IntegrationTypeEnum,
        name: state.name.trim(),
        notifyOn: Array.from(state.selectedEvents),
        metadata: finalMetadata,
        workspaceSlug: selectedWorkspace!.slug,
        projectSlug: state.selectedProjectSlug ?? undefined,
        environmentSlugs: state.selectedEnvironments,
        ...(isPrivateKeyRequired ? { privateKey: privateKeyToUse } : {})
      }
    )
  })

  const prepareMetadata = useCallback(() => {
    const state = formStateRef.current

    if (!state.name.trim()) {
      toast.error('Name of integration is required')
      return null
    }
    if (state.selectedEvents.size === 0) {
      toast.error('At least one event trigger is required')
      return null
    }
    if (
      maxEnvironmentsCount === 'single' &&
      state.selectedEnvironments.length === 0
    ) {
      toast.error('At least one environment is required')
      return null
    }

    const finalMetadata = isMappingRequired
      ? { ...state.metadata, environments: state.mappings }
      : state.metadata

    if (Object.keys(finalMetadata).length === 0) {
      toast.error('Configuration metadata is required')
      return null
    }

    const isEmptyValue = (value: unknown) =>
      (typeof value === 'string' && value.trim() === '') ||
      (typeof value === 'object' &&
        value !== null &&
        Object.keys(value).length === 0)

    if (Object.values(finalMetadata).some(isEmptyValue)) {
      toast.error('All configuration fields are required and cannot be empty')
      return null
    }

    if (
      state.selectedProjectSlug &&
      isPrivateKeyRequired &&
      !projectPrivateKey &&
      !state.manualPrivateKey.trim()
    ) {
      toast.error('Project private key is required for this integration')
      return null
    }

    return finalMetadata as Record<string, string>
  }, [
    isMappingRequired,
    isPrivateKeyRequired,
    maxEnvironmentsCount,
    projectPrivateKey
  ])

  useEffect(() => {
    if (formState.selectedProjectSlug) {
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
    } else {
      setFormState((prev) => ({
        ...prev,
        selectedProject: null,
        manualPrivateKey: ''
      }))
    }
  }, [formState.selectedProjectSlug, getProjectDetails])

  const updateFormState = useCallback((updates: Partial<FormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }))
  }, [])

  const resetFormData = useCallback(() => {
    setFormState(initialFormState)
  }, [])

  // Event handlers
  const handleProjectChange = useCallback(
    (projectSlug: Project['slug'] | null) => {
      updateFormState({
        selectedProjectSlug: projectSlug,
        selectedEnvironments: []
      })
    },
    [updateFormState]
  )

  const handleEnvironmentChange = useCallback(
    (environmentSlugs: Environment['slug'][]) => {
      updateFormState({ selectedEnvironments: environmentSlugs })
    },
    [updateFormState]
  )

  const handleEventsChange = useCallback(
    (events: Set<EventTypeEnum>) => {
      updateFormState({ selectedEvents: events })
    },
    [updateFormState]
  )

  const handleMetadataChange = useCallback(
    (metadata: Record<string, unknown>) => {
      updateFormState({ metadata })
    },
    [updateFormState]
  )

  const handleMappingsChange = useCallback(
    (mappings: VercelEnvironmentMapping) => {
      updateFormState({ mappings })
    },
    [updateFormState]
  )

  const handleManualPrivateKeyChange = useCallback(
    (manualPrivateKey: string) => {
      updateFormState({ manualPrivateKey })
    },
    [updateFormState]
  )

  const handleNameChange = useCallback(
    (name: string) => {
      updateFormState({ name })
    },
    [updateFormState]
  )

  const validateForm = useCallback(
    (state: FormState) => {
      if (!state.name.trim()) {
        toast.error('Name of integration is required')
        return false
      }

      if (state.selectedEvents.size === 0) {
        toast.error('At least one event trigger is required')
        return false
      }

      if (
        maxEnvironmentsCount === 'single' &&
        state.selectedEnvironments.length === 0
      ) {
        toast.error('At least one environment is required')
        return false
      }

      // Metadata validation
      const finalMetadata = isMappingRequired
        ? { ...state.metadata, environments: state.mappings }
        : state.metadata

      if (Object.keys(finalMetadata).length === 0) {
        toast.error('Configuration metadata is required')
        return false
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
        return false
      }

      if (
        state.selectedProjectSlug &&
        isPrivateKeyRequired &&
        !projectPrivateKey &&
        !state.manualPrivateKey.trim()
      ) {
        toast.error('Project private key is required for this integration')
        return false
      }

      return true
    },
    [
      maxEnvironmentsCount,
      isMappingRequired,
      isPrivateKeyRequired,
      projectPrivateKey
    ]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const currentState = formStateRef.current
      if (!validateForm(currentState)) return

      const finalMetadata = prepareMetadata()
      if (!finalMetadata) return

      setIsLoading(true)
      try {
        const { success, data } = await createIntegration()
        if (success && data) {
          toast.success(`${integrationName} integration created successfully!`)
          resetFormData()
          router.push('/integrations')
        }
      } catch {
        toast.error('Failed to create integration. Please try again.')
      } finally {
        setIsLoading(false)
      }
    },
    [
      createIntegration,
      integrationName,
      prepareMetadata,
      router,
      resetFormData,
      validateForm
    ]
  )

  const handleTesting = useCallback(async () => {
    const finalMetadata = prepareMetadata()
    if (!finalMetadata) return

    setIsTesting(true)
    try {
      const { success, error } = await testIntegration(finalMetadata)
      if (success) {
        toast.success('Test event sent successfully!')
      } else {
        let msg = 'Test failed. Please check your configuration.'
        if (error?.message) {
          try {
            const parsed = JSON.parse(error.message)
            msg =
              parsed.header && parsed.body
                ? `${parsed.header}: ${parsed.body}`
                : error.message
          } catch {
            msg = error.message
          }
        }
        toast.error(msg)
      }
    } catch {
      toast.error('An error occurred while testing.')
    } finally {
      setIsTesting(false)
    }
  }, [prepareMetadata, testIntegration])

  return {
    formState,
    isLoading,
    isTesting,
    config: {
      isMappingRequired,
      isPrivateKeyRequired,
      maxEnvironmentsCount
    },
    projectPrivateKey,
    privateKeyLoading,
    handlers: {
      handleSubmit,
      handleTesting,
      handleNameChange,
      handleEventsChange,
      handleMetadataChange,
      handleProjectChange,
      handleEnvironmentChange,
      handleMappingsChange,
      handleManualPrivateKeyChange
    }
  }
}
