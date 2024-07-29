import {
  CreateIntegrationRequest,
  CreateIntegrationResponse,
  DeleteIntegrationRequest,
  DeleteIntegrationResponse,
  GetAllIntegrationRequest,
  GetAllIntegrationResponse,
  GetIntegrationRequest,
  GetIntegrationResponse,
  UpdateIntegrationRequest,
  UpdateIntegrationResponse
} from '@package/types/integration.types'
import client from '@package/client'

export default class IntegrationController {
  private static apiClient = client

  static async createIntegration(
    request: CreateIntegrationRequest,
    headers?: Record<string, string>
  ): Promise<CreateIntegrationResponse> {
    return this.apiClient.post(
      `/api/integration/${request.workspaceId}`,
      request,
      headers
    )
  }

  static async updateIntegration(
    request: UpdateIntegrationRequest,
    headers?: Record<string, string>
  ): Promise<UpdateIntegrationResponse> {
    return this.apiClient.put(
      `/api/integration/${request.integrationId}`,
      request,
      headers
    )
  }

  static async getIntegration(
    request: GetIntegrationRequest,
    headers?: Record<string, string>
  ): Promise<GetIntegrationResponse> {
    return this.apiClient.get(
      `/api/integration/${request.integrationId}`,
      headers
    )
  }

  static async getAllIntegrations(
    request: GetAllIntegrationRequest,
    headers?: Record<string, string>
  ): Promise<GetAllIntegrationResponse> {
    let url = `/api/integration/all/${request.workspaceId}`
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)

    return this.apiClient.get<GetAllIntegrationResponse>(url, headers)
  }

  static async deleteIntegration(
    request: DeleteIntegrationRequest,
    headers?: Record<string, string>
  ): Promise<DeleteIntegrationResponse> {
    return this.apiClient.delete(
      `/api/integration/${request.integrationId}`,
      headers
    )
  }
}
