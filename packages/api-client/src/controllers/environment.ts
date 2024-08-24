import { APIClient } from '@api-client/core/client'
import { parseResponse } from '@api-client/core/response-parser'
import {
  CreateEnvironmentRequest,
  CreateEnvironmentResponse,
  DeleteEnvironmentRequest,
  DeleteEnvironmentResponse,
  GetAllEnvironmentsOfProjectRequest,
  GetAllEnvironmentsOfProjectResponse,
  GetEnvironmentByIdRequest,
  GetEnvironmentByIdResponse,
  UpdateEnvironmentRequest,
  UpdateEnvironmentResponse
} from '@api-client/types/environment.types'
import { ClientResponse } from '@api-client/types/index.types'

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
      `/api/environment/${request.id}`,
      request,
      headers
    )

    return await parseResponse<UpdateEnvironmentResponse>(response)
  }

  async getEnvironmentById(
    request: GetEnvironmentByIdRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetEnvironmentByIdResponse>> {
    const response = await this.apiClient.get(
      `/api/environment/${request.id}`,
      headers
    )

    return await parseResponse<GetEnvironmentByIdResponse>(response)
  }

  async getAllEnvironmentsOfProject(
    request: GetAllEnvironmentsOfProjectRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetAllEnvironmentsOfProjectResponse>> {
    let url = `/api/environment/all/${request.projectId}?`
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)

    const response = await this.apiClient.get(url, headers)

    return await parseResponse<GetAllEnvironmentsOfProjectResponse>(response)
  }

  async deleteEnvironment(
    request: DeleteEnvironmentRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DeleteEnvironmentResponse>> {
    const response = await this.apiClient.delete(
      `/api/environment/${request.id}`,
      headers
    )

    return await parseResponse<DeleteEnvironmentResponse>(response)
  }
}
