import {
  EmailShareSecretRequest,
  EmailShareSecretResponse,
  ShareSecretRequest,
  ShareSecretResponse,
  ViewShareSecretRequest,
  ViewShareSecretResponse
} from '@keyshade/schema'
import { APIClient } from '@api-client/core/client'
import { ClientResponse } from '@keyshade/schema'
import { parseResponse } from '@api-client/core/response-parser'

export default class ShareSecretController {
  private apiClient: APIClient

  constructor(private readonly backendUrl: string) {
    this.apiClient = new APIClient(this.backendUrl)
  }

  async createShareSecret(
    request: ShareSecretRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<ShareSecretResponse>> {
    const response = await this.apiClient.post(
      `/api/share-secret`,
      request,
      headers
    )

    return await parseResponse<ShareSecretResponse>(response)
  }

  async emailShareSecret(
    request: EmailShareSecretRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<EmailShareSecretResponse>> {
    const response = await this.apiClient.put(
      `/api/share-secret/${request.hash}/add-email?email=${request.email}`,
      headers
    )

    return await parseResponse<EmailShareSecretResponse>(response)
  }

  async viewShareSecret(
    request: ViewShareSecretRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<ViewShareSecretResponse>> {
    const response = await this.apiClient.get(
      `/api/share-secret/${request.hash}`,
      headers
    )

    return await parseResponse<ViewShareSecretResponse>(response)
  }
}
