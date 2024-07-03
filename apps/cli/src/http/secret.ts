import { Configuration } from '../types/command/run.types'

const SecretController = {
  async fetchSecrets(
    baseUrl: string,
    apiKey: string,
    projectId: string,
    environmentId: string
  ): Promise<Configuration[]> {
    const response = await fetch(
      `${baseUrl}/api/secret/all/${projectId}/${environmentId}`,
      {
        method: 'GET',
        headers: {
          'x-keyshade-token': apiKey
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch secrets: ' + response.statusText)
    }

    return (await response.json()) as Configuration[]
  }
}

export default SecretController
