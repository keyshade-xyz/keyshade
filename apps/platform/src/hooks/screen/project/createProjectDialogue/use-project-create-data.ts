
import type { CreateProjectRequest } from '@keyshade/schema'
import { useCallback, useState } from 'react'
import { parseEnvironmentsText } from '@/lib/utils'

const DEFAULT_PROJECT_DATA: CreateProjectRequest = {
  name: '',
  workspaceSlug: '',
  description: '',
  storePrivateKey: false,
  environments: [
    {
      name: 'default',
      description: 'Default environment for this project'
    }
  ],
  accessLevel: 'PRIVATE'
}

interface UseProjectCreateData {
  /**
   * The current project data being created.
   */
  newProjectData: CreateProjectRequest
  /**
   *Update the name of the new project.
   * @param value - The new name for the project.
   */
  updateName: (value: string) => void
  /**
   * Update description of the new project.
   * @param value - The new description for the project.
   */
  updateDescription: (value: string) => void
  /**
   * Update access level of the new project.
   * @param value - The new access level for the project.
   */
  updateAccessLevel: (value: CreateProjectRequest['accessLevel']) => void
  /**
   * Update whether to store private key or not.
   * @param value - Boolean indicating whether to store private key.
   */
  updateStorePrivateKey: (value: boolean) => void
  /**
   * Update environment details of the new project.
   * @param index - The index of the environment to Update.
   * @param field - The field to Update ('name' or 'description').
   * @param value - The new value for the field.
   */
  updateEnvironment: (
    index: number,
    field: 'name' | 'description',
    value: string
  ) => void
  /**
   * Function to create a new environment in the project.
   * This adds a new environment with default values.
   */
  createNewEnvironment: () => void
  /**
   * Function to delete an environment from the project.
   * @param index - The index of the environment to delete.
   */
  deleteEnvironment: (index: number) => void
  /**
   * Function to reset the project data to its default state.
   */
  resetProjectData: () => void
  /**
   * Handle paste of environments directly.
   * Accepts the clipboard event and the index of the environment field.
   * Responsible for parsing text and updating environments list.
   */
  handlePasteEnvironments: (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number
  ) => void
}

/**
 * Manages the state and logic for creating a new project.
 * Provides Update project data, create new environments,
 * and delete existing environments.
 */
export function useProjectCreateData(): UseProjectCreateData {
  const [newProjectData, setNewProjectData] =
    useState<CreateProjectRequest>(DEFAULT_PROJECT_DATA)

  const updateName = useCallback((value: string) => {
    setNewProjectData((prev) => ({
      ...prev,
      name: value
    }))
  }, [])

  const updateDescription = useCallback((value: string) => {
    setNewProjectData((prev) => ({
      ...prev,
      description: value
    }))
  }, [])

  const updateAccessLevel = useCallback(
    (value: CreateProjectRequest['accessLevel']) => {
      setNewProjectData((prev) => ({
        ...prev,
        accessLevel: value
      }))
    },
    []
  )

  const updateStorePrivateKey = useCallback((value: boolean) => {
    setNewProjectData((prev) => ({
      ...prev,
      storePrivateKey: value
    }))
  }, [])

  const updateEnvironment = useCallback(
    (index: number, field: 'name' | 'description', value: string) => {
      setNewProjectData((prev) => {
        const updatedEnvironments = prev.environments || []
        updatedEnvironments[index] = {
          ...updatedEnvironments[index],
          [field]: value
        }

        return {
          ...prev,
          environments: updatedEnvironments
        }
      })
    },
    []
  )

  const createNewEnvironment = useCallback(() => {
    setNewProjectData((prev) => ({
      ...prev,
      environments: [
        ...(prev.environments || []),
        {
          name: '',
          description: ''
        }
      ]
    }))
  }, [])

  const deleteEnvironment = useCallback((index: number) => {
    setNewProjectData((prev) => {
      const updatedEnvs = prev.environments?.filter((_, i) => i !== index)
      return {
        ...prev,
        environments: updatedEnvs
      }
    })
  }, [])

  const resetProjectData = useCallback(() => {
    setNewProjectData(DEFAULT_PROJECT_DATA)
  }, [])

  const setEnvironments = useCallback((environments: CreateProjectRequest['environments']) => {
    setNewProjectData((prev) => ({
      ...prev,
      environments: environments ?? []
    }))
  }, [])

  const handlePasteEnvironments = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData('text');
      if (!text) return;

      const parsed = parseEnvironmentsText(text);

      // single or multiple envs → append to existing list
      if (parsed.length >= 1) {
        e.preventDefault();
        setEnvironments([...(newProjectData.environments ?? []), ...parsed]);
      }

      // else: leaving for default paste behavior
    },
    [newProjectData.environments, setEnvironments]
  )

  return {
    newProjectData,
    updateName,
    updateDescription,
    updateAccessLevel,
    updateStorePrivateKey,
    updateEnvironment,
    deleteEnvironment,
    createNewEnvironment,
    resetProjectData,
    handlePasteEnvironments
  }
}