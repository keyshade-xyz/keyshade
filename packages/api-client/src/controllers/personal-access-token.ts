import { APIClient } from '@api-client/core/client'
import {
  ClientResponse,
  CreatePersonalAccessTokenRequest,
  CreatePersonalAccessTokenResponse,
  DeletePersonalAccessTokenRequest,
  DeletePersonalAccessTokenResponse,
  GetAllPersonalAccessTokensResponse,
  RegeneratePersonalAccessTokenRequest,
  RegeneratePersonalAccessTokenResponse,
  UpdatePersonalAccessTokenRequest,
  UpdatePersonalAccessTokenResponse
} from '@keyshade/schema'
import { parseResponse } from '@api-client/core/response-parser'

export default class PersonalAccessTokenController {
  private apiClient: APIClient

  constructor(private readonly backendURL: string) {
    this.apiClient = new APIClient(this.backendURL)
  }

  async createPersonalAccessToken(
    request: CreatePersonalAccessTokenRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<CreatePersonalAccessTokenResponse>> {
    const response = await this.apiClient.post(
      '/api/user/personal-access-token',
      request,
      headers
    )
    return await parseResponse<CreatePersonalAccessTokenResponse>(response)
  }

  async updatePersonalAccessToken(
    request: UpdatePersonalAccessTokenRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<UpdatePersonalAccessTokenResponse>> {
    const response = await this.apiClient.put(
      `/api/user/personal-access-token/${request.tokenId}`,
      request,
      headers
    )
    return await parseResponse<UpdatePersonalAccessTokenResponse>(response)
  }

  async regeneratePersonalAccessToken(
    request: RegeneratePersonalAccessTokenRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<RegeneratePersonalAccessTokenResponse>> {
    const response = await this.apiClient.put(
      `/api/user/personal-access-token/${request.tokenId}/regenerate`,
      request,
      headers
    )
    return await parseResponse<RegeneratePersonalAccessTokenResponse>(response)
  }

  async getAllPersonalAccessTokens(
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetAllPersonalAccessTokensResponse>> {
    const response = await this.apiClient.get(
      '/api/user/personal-access-token/all',
      headers
    )
    return await parseResponse<GetAllPersonalAccessTokensResponse>(response)
  }

  async deletePersonalAccessToken(
    request: DeletePersonalAccessTokenRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DeletePersonalAccessTokenResponse>> {
    const response = await this.apiClient.delete(
      `/api/user/personal-access-token/${request.tokenId}`,
      headers
    )
    return await parseResponse<DeletePersonalAccessTokenResponse>(response)
  }
}
