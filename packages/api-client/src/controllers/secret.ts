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
      `/api/secret/${request.projectId}`,
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
      `/api/secret/${request.secretId}`,
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
      `/api/secret/${request.secretId}/rollback/${request.version}?environmentId=${request.environmentId}`,
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
      `/api/secret/${request.secretId}`,
      headers
    )

    return await parseResponse<DeleteSecretResponse>(response)
  }

  async getAllSecretsOfProject(
    request: GetAllSecretsOfProjectRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetAllSecretsOfProjectResponse>> {
    let url = `/api/secret/${request.projectId}?decryptValue=true`
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)
    const response = await this.apiClient.get(url, headers)

    return await parseResponse<GetAllSecretsOfProjectResponse>(response)
  }

  async getAllSecretsOfEnvironment(
    request: GetAllSecretsOfEnvironmentRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetAllSecretsOfEnvironmentResponse>> {
    let url = `/api/secret/${request.projectId}/${request.environmentId}`
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)
    const response = await this.apiClient.get(url, headers)

    return await parseResponse<GetAllSecretsOfEnvironmentResponse>(response)
  }
}
