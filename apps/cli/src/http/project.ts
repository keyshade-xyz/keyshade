import { EnvironmentData } from 'src/types/command/environment.types'

class EnvironmentController {
  async createEnvironment(
    baseUrl: string,
    apiKey: string,
    project_id: string,
    environmentData: EnvironmentData
  ): Promise<any> {
    const response = await fetch(`${baseUrl}/api/environment/${project_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-keyshade-token': apiKey
      },
      body: JSON.stringify(environmentData)
    })

    if (!response.ok) {
      throw new Error(
        `Cannot Create new Environment with id-${project_id}` +
          response.statusText
      )
    }

    return (await response.json()) as any
  }

  async getEnvironmentById(
    baseUrl: string,
    apiKey: string,
    environment_id: string
  ): Promise<any> {
    const response = await fetch(
      `${baseUrl}/api/environment/${environment_id}`,
      {
        method: 'GET',
        headers: {
          'x-keyshade-token': apiKey
        }
      }
    )

    if (!response.ok) {
      throw new Error(
        `Cannot get Environment with id-${environment_id}` + response.statusText
      )
    }

    return (await response.json()) as any
  }

  async getAllEnvironmentByProjectId(
    baseUrl: string,
    apiKey: string,
    project_id: string
  ): Promise<any> {
    const response = await fetch(
      `${baseUrl}/api/environment/all/${project_id}`,
      {
        method: 'GET',
        headers: {
          'x-keyshade-token': apiKey
        }
      }
    )

    if (!response.ok) {
      throw new Error(
        `Cannot get all Environment of Project with id-${project_id}` +
          response.statusText
      )
    }

    return (await response.json()) as any
  }

  async deleteEnvironment(
    baseUrl: string,
    apiKey: string,
    environment_id: string
  ): Promise<any> {
    const response = await fetch(
      `${baseUrl}/api/environment/${environment_id}`,
      {
        method: 'DELETE',
        headers: {
          'x-keyshade-token': apiKey
        }
      }
    )

    if (!response.ok) {
      throw new Error(
        `Cannot get Environment with id-${environment_id}` + response.statusText
      )
    }

    return (await response.json()) as any
  }

  async updateEnvironment(
    baseUrl: string,
    apiKey: string,
    environment_id: string,
    environmentData: EnvironmentData
  ): Promise<any> {
    const response = await fetch(
      `${baseUrl}/api/environment/${environment_id}`,
      {
        method: 'PUT',
        headers: {
          'x-keyshade-token': apiKey
        },
        body: JSON.stringify(environmentData)
      }
    )

    if (!response.ok) {
      throw new Error(
        `Cannot get Environment with id-${environment_id}` + response.statusText
      )
    }

    return (await response.json()) as any
  }
}

export default EnvironmentController
