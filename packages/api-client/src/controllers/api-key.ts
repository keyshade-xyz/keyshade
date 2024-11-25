import {
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  UpdateApiKeyRequest,
  UpdateApiKeyResponse,
  DeleteApiKeyRequest,
  DeleteApiKeyResponse,
  GetApiKeysOfUserRequest,
  GetApiKeysOfUserResponse,
  GetApiKeyRequest,
  GetApiKeyResponse,
  CanAccessLiveUpdatesApiKeyRequest,
  CanAccessLiveUpdatesApiKeyResponse
} from '@keyshade/schema'
import { APIClient } from '@api-client/core/client'
import { parseResponse } from '@api-client/core/response-parser'
import { ClientResponse } from '@keyshade/schema'
import { parsePaginationUrl } from '@api-client/core/pagination-parser'

export default class ApiKeyController {
  private apiClient: APIClient

  constructor(private readonly backendURL: string) {
    this.apiClient = new APIClient(this.backendURL)
  }

  async crateApiKey(
    request: CreateApiKeyRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<CreateApiKeyResponse>> {
    const response = await this.apiClient.post(`/api/api-key`, request, headers)
    return await parseResponse<CreateApiKeyResponse>(response)
  }

  async updateApiKey(
    request: UpdateApiKeyRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<UpdateApiKeyResponse>> {
    const response = await this.apiClient.put(
      `/api/api-key/${request.apiKeySlug}`,
      request,
      headers
    )
    return await parseResponse<UpdateApiKeyResponse>(response)
  }

  async deleteApiKey(
    request: DeleteApiKeyRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DeleteApiKeyResponse>> {
    const response = await this.apiClient.delete(
      `/api/api-key/${request.apiKeySlug}`,
      headers
    )
    return await parseResponse<DeleteApiKeyResponse>(response)
  }

  async getApiKeysOfUser(
    request: GetApiKeysOfUserRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetApiKeysOfUserResponse>> {
    const url = parsePaginationUrl(`/api/api-key`, request)
    const response = await this.apiClient.get(url, headers)
    return await parseResponse<GetApiKeysOfUserResponse>(response)
  }

  async getApiKey(
    request: GetApiKeyRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetApiKeyResponse>> {
    const response = await this.apiClient.get(
      `/api/api-key/${request.apiKeySlug}`,
      headers
    )
    return await parseResponse<GetApiKeyResponse>(response)
  }

  async canAccessLiveUpdatesApiKey(
    request: CanAccessLiveUpdatesApiKeyRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<CanAccessLiveUpdatesApiKeyResponse>> {
    const response = await this.apiClient.get(
      `/api/api-key/access/live-updates`,
      headers
    )
    return await parseResponse<CanAccessLiveUpdatesApiKeyResponse>(response)
  }
}
