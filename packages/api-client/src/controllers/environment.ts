import { APIClient } from '@api-client/core/client'
import { parsePaginationUrl } from '@api-client/core/pagination-parser'
import { parseResponse } from '@api-client/core/response-parser'
import {
  CreateEnvironmentRequest,
  CreateEnvironmentResponse,
  DeleteEnvironmentRequest,
  DeleteEnvironmentResponse,
  GetAllEnvironmentsOfProjectRequest,
  GetAllEnvironmentsOfProjectResponse,
  GetEnvironmentRequest,
  GetEnvironmentResponse,
  UpdateEnvironmentRequest,
  UpdateEnvironmentResponse
} from '@api-client/types/environment.types'
import { ClientResponse } from '@keyshade/schema'

export default class EnvironmentController {
  private apiClient: APIClient

  constructor(private readonly backendUrl: string) {
    this.apiClient = new APIClient(this.backendUrl)
  }

  async createEnvironment(
    request: CreateEnvironmentRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<CreateEnvironmentResponse>> {
    const response = await this.apiClient.post(
      `/api/environment/${request.projectId}`,
      request,
      headers
    )

    return await parseResponse<CreateEnvironmentResponse>(response)
  }

  async updateEnvironment(
    request: UpdateEnvironmentRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<UpdateEnvironmentResponse>> {
    const response = await this.apiClient.put(
      `/api/environment/${request.slug}`,
      request,
      headers
    )

    return await parseResponse<UpdateEnvironmentResponse>(response)
  }

  async getEnvironment(
    request: GetEnvironmentRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetEnvironmentResponse>> {
    const response = await this.apiClient.get(
      `/api/environment/${request.slug}`,
      headers
    )

    return await parseResponse<GetEnvironmentResponse>(response)
  }

  async getAllEnvironmentsOfProject(
    request: GetAllEnvironmentsOfProjectRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetAllEnvironmentsOfProjectResponse>> {
    const url = parsePaginationUrl(
      `/api/environment/all/${request.projectSlug}`,
      request
    )
    const response = await this.apiClient.get(url, headers)

    return await parseResponse<GetAllEnvironmentsOfProjectResponse>(response)
  }

  async deleteEnvironment(
    request: DeleteEnvironmentRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DeleteEnvironmentResponse>> {
    const response = await this.apiClient.delete(
      `/api/environment/${request.slug}`,
      headers
    )

    return await parseResponse<DeleteEnvironmentResponse>(response)
  }
}
