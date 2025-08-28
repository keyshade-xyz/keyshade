import {
  CreateIntegrationRequest,
  CreateIntegrationResponse,
  DeleteIntegrationRequest,
  DeleteIntegrationResponse,
  GetAllIntegrationRequest,
  GetAllIntegrationResponse,
  GetAllIntegrationRunsRequest,
  GetAllIntegrationRunsResponse,
  GetIntegrationRequest,
  GetIntegrationResponse,
  UpdateIntegrationRequest,
  UpdateIntegrationResponse,
  ValidateIntegrationConfigurationRequest,
  ValidateIntegrationConfigurationResponse,
  GetVercelEnvironmentsRequest,
  GetVercelEnvironmentsResponse
} from '@keyshade/schema'
import { APIClient } from '@api-client/core/client'
import { ClientResponse } from '@keyshade/schema'
import { parseResponse } from '@api-client/core/response-parser'
import { parsePaginationUrl } from '@api-client/core/pagination-parser'

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
      `/api/integration/${request.workspaceSlug}`,
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
      `/api/integration/${request.integrationSlug}`,
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
      `/api/integration/${request.integrationSlug}`,
      headers
    )
    return await parseResponse<GetIntegrationResponse>(response)
  }

  async getAllIntegrations(
    request: GetAllIntegrationRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetAllIntegrationResponse>> {
    const url = parsePaginationUrl(
      `/api/integration/all/${request.workspaceSlug}`,
      request
    )
    const response = await this.apiClient.get(url, headers)
    return await parseResponse<GetAllIntegrationResponse>(response)
  }

  async getAllIntegrationRuns(
    request: GetAllIntegrationRunsRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetAllIntegrationRunsResponse>> {
    const url = parsePaginationUrl(
      `/api/integration/${request.integrationSlug}/runs`,
      request
    )
    const response = await this.apiClient.get(url, headers)
    return await parseResponse<GetAllIntegrationRunsResponse>(response)
  }

  async getVercelEnvironments(
    request: GetVercelEnvironmentsRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetVercelEnvironmentsResponse>> {
    const response = await this.apiClient.put(
      `/api/integration/${request.integrationSlug}/vercel/environments`,
      headers
    )

    return await parseResponse<GetVercelEnvironmentsResponse>(response)
  }

  async deleteIntegration(
    request: DeleteIntegrationRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DeleteIntegrationResponse>> {
    const response = await this.apiClient.delete(
      `/api/integration/${request.integrationSlug}`,
      headers
    )
    return await parseResponse<DeleteIntegrationResponse>(response)
  }

  async validateIntegrationConfiguration(
    request: ValidateIntegrationConfigurationRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<ValidateIntegrationConfigurationResponse>> {
    const {
      isCreate,
      integrationSlug = '',
      ...bodyPayload
    } = request as ValidateIntegrationConfigurationRequest & {
      integrationSlug?: string
    }

    const url =
      `/api/integration/validate-config?` +
      (isCreate ? 'isCreate=true' : 'isCreate=false') +
      (isCreate === false ? `&integrationSlug=${integrationSlug}` : '')

    const response = await this.apiClient.post(url, bodyPayload, headers)
    return await parseResponse<ValidateIntegrationConfigurationResponse>(
      response
    )
  }
}
