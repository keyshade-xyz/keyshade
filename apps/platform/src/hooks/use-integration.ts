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

export enum IntegrationStep {
  BasicInfo = 'basic_info',
  ProjectEnvironment = 'project_environment'
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
  const [currentStep, setCurrentStep] = useState<IntegrationStep>(
    IntegrationStep.BasicInfo
  )
  const [isLoading, setIsLoading] = useState(false)
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
    setCurrentStep(IntegrationStep.BasicInfo)
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

  const validateBasicInfo = useCallback(
    (state: FormState) => {
      if (!state.name.trim()) {
        toast.error('Name of integration is required')
        return false
      }

      if (state.selectedEvents.size === 0) {
        toast.error('At least one event trigger is required')
        return false
      }

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

      return true
    },
    [isMappingRequired]
  )

  const validateProjectEnvironment = useCallback(
    (state: FormState) => {
      if (
        maxEnvironmentsCount === 'single' &&
        state.selectedEnvironments.length === 0
      ) {
        toast.error('At least one environment is required')
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
    [maxEnvironmentsCount, isPrivateKeyRequired, projectPrivateKey]
  )

  const handleNextStep = useCallback(() => {
    const currentState = formStateRef.current

    if (currentStep === IntegrationStep.BasicInfo) {
      if (validateBasicInfo(currentState)) {
        setCurrentStep(IntegrationStep.ProjectEnvironment)
      }
    }
  }, [currentStep, validateBasicInfo])

  const handlePreviousStep = useCallback(() => {
    if (currentStep === IntegrationStep.ProjectEnvironment) {
      setCurrentStep(IntegrationStep.BasicInfo)
    }
  }, [currentStep])

  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<boolean> => {
      e.preventDefault()

      const currentState = formStateRef.current

      if (!validateProjectEnvironment(currentState)) return false

      setIsLoading(true)

      try {
        const { success, data } = await createIntegration()
        if (success && data) {
          toast.success(`${integrationName} integration created successfully!`)
          resetFormData()
          router.push('/integrations')
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
      createIntegration,
      integrationName,
      router,
      resetFormData,
      validateProjectEnvironment
    ]
  )

  return {
    formState,
    currentStep,
    isLoading,
    config: {
      isMappingRequired,
      isPrivateKeyRequired,
      maxEnvironmentsCount
    },
    projectPrivateKey,
    privateKeyLoading,
    handlers: {
      handleSubmit,
      handleNameChange,
      handleEventsChange,
      handleMetadataChange,
      handleProjectChange,
      handleEnvironmentChange,
      handleMappingsChange,
      handleManualPrivateKeyChange,
      handleNextStep,
      handlePreviousStep
    }
  }
}
