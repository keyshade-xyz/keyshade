import client from '../../client'
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
} from '../../types/environment.types'

export default class EnvironmentController {
  private static apiClient = client

  static async createEnvironment(
    request: CreateEnvironmentRequest,
    headers?: Record<string, string>
  ): Promise<CreateEnvironmentResponse> {
    return this.apiClient.post<CreateEnvironmentResponse>(
      `/api/environment/${request.projectId}`,
      request,
      headers
    )
  }

  static async updateEnvironment(
    request: UpdateEnvironmentRequest,
    headers?: Record<string, string>
  ): Promise<UpdateEnvironmentResponse> {
    return this.apiClient.put<UpdateEnvironmentResponse>(
      `/api/environment/${request.id}`,
      request,
      headers
    )
  }

  static async getEnvironmentById(
    request: GetEnvironmentByIdRequest,

    headers?: Record<string, string>
  ): Promise<GetEnvironmentByIdResponse> {
    return this.apiClient.get<GetEnvironmentByIdResponse>(
      `/api/environment/${request.id}`,
      headers
    )
  }

  static async getAllEnvironmentsOfProject(
    request: GetAllEnvironmentsOfProjectRequest,
    headers?: Record<string, string>
  ): Promise<GetAllEnvironmentsOfProjectResponse> {
    let url = `/api/environment/all/${request.projectId}?`
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)

    return this.apiClient.get<GetAllEnvironmentsOfProjectResponse>(url, headers)
  }

  static async deleteEnvironment(
    request: DeleteEnvironmentRequest,
    headers?: Record<string, string>
  ): Promise<DeleteEnvironmentResponse> {
    return this.apiClient.delete<DeleteEnvironmentResponse>(
      `/api/environment/${request.id}`,
      headers
    )
  }
}
