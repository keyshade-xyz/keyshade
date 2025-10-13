import { APIClient } from '@api-client/core/client'
import {
  ClientResponse,
  GetAllBrowserSessionsResponse,
  RevokeBrowserSessionRequest,
  RevokeBrowserSessionResponse
} from '@keyshade/schema'
import { parseResponse } from '@api-client/core/response-parser'

export default class BrowserSessionController {
  private apiClient: APIClient

  constructor(private readonly backendURL: string) {
    this.apiClient = new APIClient(this.backendURL)
  }

  async getAllBrowserSessions(
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetAllBrowserSessionsResponse>> {
    const response = await this.apiClient.get(
      '/api/session/browser/all',
      headers
    )
    return await parseResponse<GetAllBrowserSessionsResponse>(response)
  }

  async revokeBrowserSession(
    request: RevokeBrowserSessionRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<RevokeBrowserSessionResponse>> {
    const response = await this.apiClient.delete(
      `/api/session/browser/revoke/${request.sessionId}`,
      headers
    )
    return await parseResponse<RevokeBrowserSessionResponse>(response)
  }
}
