import { Logger } from '@/util/logger'

const AuthController = {
  async checkApiKeyValidity(baseUrl: string, apiKey: string): Promise<void> {
    Logger.info('Checking API key validity...')
    const response = await fetch(`${baseUrl}/api/api-key/access/live-updates`, {
      headers: {
        'x-keyshade-token': apiKey
      }
    })

    if (!response.ok) {
      throw new Error(
        'API key is not valid. Please check the key and try again.'
      )
    }

    Logger.info('API key is valid!')
  }
}

export default AuthController
