import { Configuration } from '../commands/run/run.types'

const VariableController = {
  async fetchVariables(
    baseUrl: string,
    apiKey: string,
    projectId: string,
    environmentId: string
  ): Promise<Configuration[]> {
    const response = await fetch(
      `${baseUrl}/api/variable/all/${projectId}/${environmentId}`,
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

export default VariableController
