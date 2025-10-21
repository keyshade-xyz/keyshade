import { APIClient } from '@api-client/core/client'
import {
  ClientResponse,
  GetAllCliSessionsResponse,
  RevokeCliSessionRequest,
  RevokeCliSessionResponse
} from '@keyshade/schema'
import { parseResponse } from '@api-client/core/response-parser'

export default class CliSessionController {
  private apiClient: APIClient

  constructor(private readonly backendURL: string) {
    this.apiClient = new APIClient(this.backendURL)
  }

  async getAllCliSessions(
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetAllCliSessionsResponse>> {
    const response = await this.apiClient.get('/api/session/cli/all', headers)
    return await parseResponse<GetAllCliSessionsResponse>(response)
  }

  async revokeCliSession(
    request: RevokeCliSessionRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<RevokeCliSessionResponse>> {
    const response = await this.apiClient.delete(
      `/api/session/cli/revoke/${request.sessionId}`,
      headers
    )
    return await parseResponse<RevokeCliSessionResponse>(response)
  }
}
