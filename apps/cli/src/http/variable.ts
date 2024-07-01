import type { Configuration } from '@/types/command/run.types'

class VariableControllerClass{
  static async fetchVariables(
    baseUrl: string,
    apiKey: string,
    projectId: string,
    environmentId: string
  ): Promise<Configuration[]> {
    const response = await fetch(
      `${baseUrl}/api/variable/${projectId}/${environmentId}`,
      {
        method: 'GET',
        headers: {
          'x-keyshade-token': apiKey
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch variables: ' + response.statusText)
    }

    return (await response.json()) as Configuration[]
  }
}

const VariableController = new VariableControllerClass();

export default VariableController
