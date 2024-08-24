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
} from '../types/integration.types'
import { APIClient } from '../core/client'
import { ClientResponse } from '../types/index.types'
import { parseResponse } from '../core/response-parser'

export default class IntegrationController {
  private apiClient: APIClient

  constructor(private readonly backendUrl: string) {
    this.apiClient = new APIClient(this.backendUrl)
  }

  async createIntegration(
    request: CreateIntegrationRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<CreateIntegrationResponse>> {
    const response = await this.apiClient.post(
      `/api/integration/${request.workspaceId}`,
      request,
      headers
    )
    return await parseResponse<CreateIntegrationResponse>(response)
  }

  async updateIntegration(
    request: UpdateIntegrationRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<UpdateIntegrationResponse>> {
    const response = await this.apiClient.put(
      `/api/integration/${request.integrationId}`,
      request,
      headers
    )
    return await parseResponse<UpdateIntegrationResponse>(response)
  }

  async getIntegration(
    request: GetIntegrationRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetIntegrationResponse>> {
    const response = await this.apiClient.get(
      `/api/integration/${request.integrationId}`,
      headers
    )
    return await parseResponse<GetIntegrationResponse>(response)
  }

  async getAllIntegrations(
    request: GetAllIntegrationRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetAllIntegrationResponse>> {
    let url = `/api/integration/all/${request.workspaceId}`
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)

    const response = await this.apiClient.get(url, headers)
    return await parseResponse<GetAllIntegrationResponse>(response)
  }

  async deleteIntegration(
    request: DeleteIntegrationRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DeleteIntegrationResponse>> {
    const response = await this.apiClient.delete(
      `/api/integration/${request.integrationId}`,
      headers
    )
    return await parseResponse<DeleteIntegrationResponse>(response)
  }
}
