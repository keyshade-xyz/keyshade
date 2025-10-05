import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import type {
  CreateProjectRequest,
  GetAllProjectsResponse
} from '@keyshade/schema'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useHttp } from '../use-http'
import {
  createProjectOpenAtom,
  projectsOfWorkspaceAtom,
  selectedWorkspaceAtom,
  workspaceProjectCountAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'

interface UseCreateNewProjectResponse {
  /**
   * Indicates if the project creation is currently loading.
   */
  isLoading: boolean
  /**
   * Function to create a new project.
   * This function will handle the project creation logic, including validation and API calls.
   */
  createNewProject: () => Promise<void>
  /**
   * List of projects in the current workspace.
   */
  projects: GetAllProjectsResponse['items']
}

export function useCreateNewProject(
  newProjectData: CreateProjectRequest,
  setProjectKeys: Dispatch<
    SetStateAction<
      | {
          projectName: string
          environmentSlug: string
          storePrivateKey: boolean
          keys: {
            publicKey: string
            privateKey: string
          }
        }
      | undefined
    >
  >,
  setProjectSlug: Dispatch<SetStateAction<string>>
): UseCreateNewProjectResponse {
  const [projects, setProjects] = useAtom(projectsOfWorkspaceAtom)
  const setWorkspaceProjectCount = useSetAtom(workspaceProjectCountAtom)
  const setIsCreateProjectDialogOpen = useSetAtom(createProjectOpenAtom)
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [isLoading, setIsLoading] = useState(false)

  const createProject = useHttp(() =>
    ControllerInstance.getInstance().projectController.createProject({
      ...newProjectData,
      workspaceSlug: selectedWorkspace!.slug,
      environments:
        newProjectData.environments?.filter((env) => env.name.trim() !== '') ||
        []
    })
  )

  const getProjectEnvironment = useHttp((newProjectSlug: string) =>
    ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      {
        projectSlug: newProjectSlug
      }
    )
  )

  const createNewProject = useCallback(async () => {
    if (selectedWorkspace) {
      if (newProjectData.name.trim() === '') {
        toast.error('Project name cannot be empty')
        return
      }

      setIsLoading(true)

      if (newProjectData.environments?.some((env) => env.name.trim() === '')) {
        toast.error('Environment name cannot be empty')
        setIsLoading(false)
        toast.dismiss()
        return
      }

      toast.loading('Creating project...')

      try {
        const { data, success } = await createProject()

        if (success && data) {
          setProjects([...projects, data])
          setWorkspaceProjectCount((prev) => prev + 1)

          await getProjectEnvironment(data.slug).then(
            ({ data: envData, success: envSuccess }) => {
              if (envSuccess && envData) {
                setProjectKeys({
                  projectName: data.name,
                  environmentSlug: envData.items[0].slug,
                  storePrivateKey: data.storePrivateKey,
                  keys: {
                    publicKey: data.publicKey,
                    privateKey: data.privateKey
                  }
                })
                setProjectSlug(data.slug)
              }
            }
          )
        }
      } finally {
        setIsCreateProjectDialogOpen(false)
        setIsLoading(false)
        toast.dismiss()
      }
    }
  }, [
    selectedWorkspace,
    newProjectData.name,
    newProjectData.environments,
    createProject,
    setProjects,
    projects,
    setWorkspaceProjectCount,
    getProjectEnvironment,
    setProjectKeys,
    setProjectSlug,
    setIsCreateProjectDialogOpen
  ])

  return {
    isLoading,
    createNewProject,
    projects
  }
}
