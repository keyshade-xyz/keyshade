import { APIClient } from '@api-client/core/client'
import { ClientResponse } from '@api-client/types/index.types'
import { parseResponse } from '@api-client/core/response-parser'
import {
  CreateSecretRequest,
  CreateSecretResponse,
  DeleteSecretRequest,
  DeleteSecretResponse,
  GetAllSecretsOfEnvironmentRequest,
  GetAllSecretsOfEnvironmentResponse,
  GetAllSecretsOfProjectRequest,
  GetAllSecretsOfProjectResponse,
  RollBackSecretRequest,
  RollBackSecretResponse,
  UpdateSecretRequest,
  UpdateSecretResponse
} from '@api-client/types/secret.types'
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
      `${url}&decryptValue=true`,
      headers
    )

    return await parseResponse<GetAllSecretsOfProjectResponse>(response)
  }

  async getAllSecretsOfEnvironment(
    request: GetAllSecretsOfEnvironmentRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetAllSecretsOfEnvironmentResponse>> {
    const url = `/api/secret/${request.projectSlug}/${request.environmentSlug}`
    const response = await this.apiClient.get(url, headers)

    return await parseResponse<GetAllSecretsOfEnvironmentResponse>(response)
  }
}
