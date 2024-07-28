import client from '@package/client'
import {
  CreateSecretRequest,
  CreateSecretResponse,
  DeleteSecretRequest,
  DeleteSecretResponse,
  getAllSecretsOfEnvironmentRequest,
  getAllSecretsOfEnvironmentResponse,
  getAllSecretsOfProjectRequest,
  getAllSecretsOfProjectResponse,
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
    request: getAllSecretsOfProjectRequest,
    headers?: Record<string, string>
  ): Promise<getAllSecretsOfProjectResponse> {
    return this.apiClient.get(
      `/api/secret/${request.projectId}?decryptValue=true`,
      headers
    )
  }

  static async getAllSecretsOfEnvironment(
    request: getAllSecretsOfEnvironmentRequest,
    headers?: Record<string, string>
  ): Promise<getAllSecretsOfEnvironmentResponse> {
    return this.apiClient.get(
      `}/api/secret/${request.projectId}/${request.environmentId}`,
      headers
    )
  }
}
