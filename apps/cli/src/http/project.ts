import { Project, ProjectData } from "src/commands/project/project.types"

const ProjectController = {
  async listProjects(
    baseUrl: string,
    apiKey: string,
    workspaceId: string
  ): Promise<Project[]> {
    const response = await fetch(
      `${baseUrl}/api/project/all/${workspaceId}`,
      {
        method: 'GET',
        headers: {
          'x-keyshade-token': apiKey
        }
      }
    )

    if(!response.ok) {
      throw new Error(`Failed to fetch projects for workspace: ${workspaceId} ` + response.statusText)
    }

    return (await response.json()) as Project[]
  },

  async getProject(
    baseUrl: string,
    apikey: string,
    projectId: string
  ): Promise<Project> {
    const response = await fetch(
      `${baseUrl}/api/project/${projectId}`,
      {
        method: 'GET',
        headers: {
          'x-keyshade-token': apikey
        }
      }
    )

    if(!response.ok) {
      throw new Error(`Error fetching Project: ${projectId} ` + response.statusText)
    }

    return (await response.json()) as Project
  },

  async createProject(
    baseUrl: string,
    apikey: string,
    workspaceId: string,
    projectData: ProjectData
  ): Promise<Project> {
    const response = await fetch(
      `${baseUrl}/api/project/${workspaceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-keyshade-token': apikey
        },
        body: JSON.stringify(projectData)
      }
    )

    if(!response.ok) {
      throw new Error('Cannot Create new Project '+ response.statusText)
    }

    return (await response.json()) as Project
  }
}

export default ProjectController