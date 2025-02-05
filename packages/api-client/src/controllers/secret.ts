import { APIClient } from '@api-client/core/client'
import { ClientResponse } from '@keyshade/schema'
import { parseResponse } from '@api-client/core/response-parser'
import {
  CreateSecretRequest,
  CreateSecretResponse,
  DeleteSecretRequest,
  DeleteSecretResponse,
  GetAllSecretsOfProjectRequest,
  GetAllSecretsOfProjectResponse,
  GetRevisionsOfSecretRequest,
  GetRevisionsOfSecretResponse,
  RollBackSecretRequest,
  RollBackSecretResponse,
  UpdateSecretRequest,
  UpdateSecretResponse
} from '@keyshade/schema'
import { parsePaginationUrl } from '@api-client/core/pagination-parser'

export default class SecretController {
  private apiClient: APIClient

  constructor(private readonly backendUrl: string) {
    this.apiClient = new APIClient(this.backendUrl)
  }

  async createSecret(
    request: CreateSecretRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<CreateSecretResponse>> {
    const response = await this.apiClient.post(
      `/api/secret/${request.projectSlug}`,
      request,
      headers
    )

    return await parseResponse<CreateSecretResponse>(response)
  }

  async updateSecret(
    request: UpdateSecretRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<UpdateSecretResponse>> {
    const response = await this.apiClient.put(
      `/api/secret/${request.secretSlug}`,
      request,
      headers
    )

    return await parseResponse<UpdateSecretResponse>(response)
  }

  async rollbackSecret(
    request: RollBackSecretRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<RollBackSecretResponse>> {
    const response = await this.apiClient.put(
      `/api/secret/${request.secretSlug}/rollback/${request.version}?environmentSlug=${request.environmentSlug}`,
      request,
      headers
    )

    return await parseResponse<RollBackSecretResponse>(response)
  }

  async deleteSecret(
    request: DeleteSecretRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DeleteSecretResponse>> {
    const response = await this.apiClient.delete(
      `/api/secret/${request.secretSlug}`,
      headers
    )

    return await parseResponse<DeleteSecretResponse>(response)
  }

  async getAllSecretsOfProject(
    request: GetAllSecretsOfProjectRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetAllSecretsOfProjectResponse>> {
    const url = parsePaginationUrl(
      `/api/secret/${request.projectSlug}`,
      request
    )
    const response = await this.apiClient.get(
      `${url}&decryptValue=${request.decryptValue}`,
      headers
    )

    return await parseResponse<GetAllSecretsOfProjectResponse>(response)
  }

  async getRevisionsOfSecret(
    request: GetRevisionsOfSecretRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetRevisionsOfSecretResponse>> {
    const url = parsePaginationUrl(
      `/api/secret/${request.secretSlug}/revisions/${request.environmentSlug}`,
      request
    )
    const response = await this.apiClient.get(
      `${url}&decryptValue=${request.decryptValue}`,
      headers
    )

    return await parseResponse<GetRevisionsOfSecretResponse>(response)
  }
}
