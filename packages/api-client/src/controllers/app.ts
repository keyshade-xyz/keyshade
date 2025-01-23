import { APIClient } from '@api-client/core/client'

export default class AppController {
  private apiClient: APIClient

  constructor(private readonly backendURL: string) {
    this.apiClient = new APIClient(this.backendURL)
  }

  async health(headers?: Record<string, string>): Promise<string> {
    const response = await this.apiClient.get(`/api/health`, headers)
    return response.text()
  }
}
