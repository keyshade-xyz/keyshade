import { z } from 'zod'
import { apiClient } from '../api-client'
import { zProject, zProjectWithoutKeys } from '@/types'
import type { NewProject, Project, ProjectWithoutKeys } from '@/types'

/**
 * Retrieves projects by workspace ID.
 * @param currentWorkspaceID - The ID of the current workspace.
 * @returns A promise that resolves to an array of projects without keys, or an empty array, or undefined.
 */
async function getProjectsbyWorkspaceID(
  currentWorkspaceID: string
): Promise<ProjectWithoutKeys[] | [] | undefined> {
  try {
    const projectData = await apiClient.get<ProjectWithoutKeys[] | []>(
      `/project/all/${currentWorkspaceID}`
    )

    const zProjectWithoutKeysArray = z.array(zProjectWithoutKeys)
    const { success, data } = zProjectWithoutKeysArray.safeParse(projectData)
    
    if (!success) {
      throw new Error('Invalid data')
    }
    return data
  } catch (error) {
    // eslint-disable-next-line no-console -- we need to log the error
    console.error(error)
  }
}

/**
 * Creates a new project.
 *
 * @param newProjectData - The data for the new project.
 * @param currentWorkspaceID - The ID of the current workspace.
 * @returns A Promise that resolves to void.
 */
async function createProject(
  newProjectData: NewProject,
  currentWorkspaceID: string
): Promise<void> {
  try {
    await apiClient.post<NewProject>(`/project/${currentWorkspaceID}`, {
      newProjectData
    })
  } catch (error) {
    // eslint-disable-next-line no-console -- we need to log the error
    console.error(error)
  }
}

/**
 * Retrieves a project by its ID.
 * @param id - The ID of the project to retrieve.
 * @returns A Promise that resolves to the retrieved project, or undefined if not found.
 */
async function getProjectbyID(id: string): Promise<Project | undefined> {
  try {
    const projectData = await apiClient.get<Project>(`/project/${id}`)

    const { success, data } = zProject.safeParse(projectData)
    if (!success) {
      throw new Error('Invalid data')
    }
    return data
  } catch (error) {
    // eslint-disable-next-line no-console -- we need to log the error
    console.error(error)
  }
}

export const Projects = {
  getProjectsbyWorkspaceID,
  createProject,
  getProjectbyID
}
