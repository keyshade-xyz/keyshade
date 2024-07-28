import client from '@package/client'
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
} from '@package/types/secret.types'

export default class SecretController {
  private static apiClient = client

  static async createSecret(
    request: CreateSecretRequest,
    headers?: Record<string, string>
  ): Promise<CreateSecretResponse> {
    return this.apiClient.post(
      `/api/secret/${request.projectId}`,
      request,
      headers
    )
  }
  static async updateSecret(
    request: UpdateSecretRequest,
    headers?: Record<string, string>
  ): Promise<UpdateSecretResponse> {
    return this.apiClient.put(
      `/api/secret/${request.secretId}`,
      request,
      headers
    )
  }

  static async rollbackSecret(
    request: RollBackSecretRequest,
    headers?: Record<string, string>
  ): Promise<RollBackSecretResponse> {
    return this.apiClient.put(
      `/api/secret/${request.secretId}/rollback/${request.version}?environmentId=${request.environmentId}`,
      request,
      headers
    )
  }

  static async deleteSecret(
    request: DeleteSecretRequest,
    headers?: Record<string, string>
  ): Promise<DeleteSecretResponse> {
    return this.apiClient.delete(`/api/secret/${request.secretId}`, headers)
  }

  static async getAllSecretsOfProject(
    request: GetAllSecretsOfProjectRequest,
    headers?: Record<string, string>
  ): Promise<GetAllSecretsOfProjectResponse[]> {
    let url = `/api/secret/${request.projectId}?decryptValue=true`
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)
    return this.apiClient.get<GetAllSecretsOfProjectResponse[]>(url, headers)
  }

  static async getAllSecretsOfEnvironment(
    request: GetAllSecretsOfEnvironmentRequest,
    headers?: Record<string, string>
  ): Promise<GetAllSecretsOfEnvironmentResponse[]> {
    let url = `/api/secret/${request.projectId}/${request.environmentId}`
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)
    return this.apiClient.get<GetAllSecretsOfEnvironmentResponse[]>(
      url,
      headers
    )
  }
}
