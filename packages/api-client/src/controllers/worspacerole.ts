import client from '@package/client'
import { GetAllEnvironmentsOfProjectRequest } from '@package/types/environment.types'
import {
  CreateWorkspaceRoleRequest,
  CreateWorkspaceRoleResponse,
  DeleteWorkspaceRoleRequest,
  DeleteWorkspaceRoleResponse,
  GetAllWorkspaceRolesOfProjectRequest,
  GetAllWorkspaceRolesOfProjectResponse,
  UpdateWorkspaceRoleRequest,
  UpdateWorkspaceRoleResponse
} from '@package/types/workspace.types'

export default class EnvironmentController {
  private static apiClient = client

  static async createEnvironment(
    request: CreateWorkspaceRoleRequest,
    headers?: Record<string, string>
  ): Promise<CreateWorkspaceRoleResponse> {
    return this.apiClient.post<CreateWorkspaceRoleResponse>(
      `/api/environment/${request.workspaceId}`,
      request,
      headers
    )
  }

  static async updateEnvironment(
    request: UpdateWorkspaceRoleRequest,
    headers?: Record<string, string>
  ): Promise<UpdateWorkspaceRoleResponse> {
    return this.apiClient.put<UpdateWorkspaceRoleResponse>(
      `/api/environment/${request.id}`,
      request,
      headers
    )
  }

  static async getEnvironmentById(
    request: GetAllWorkspaceRolesOfProjectRequest,

    headers?: Record<string, string>
  ): Promise<GetAllWorkspaceRolesOfProjectResponse> {
    return this.apiClient.get<GetAllWorkspaceRolesOfProjectResponse>(
      `/api/environment/${request.id}`,
      headers
    )
  }

  static async getAllEnvironmentsOfProject(
    request: GetAllEnvironmentsOfProjectRequest,
    headers?: Record<string, string>
  ): Promise<GetAllWorkspaceRolesOfProjectResponse> {
    let url = `/api/environment/all/${request.projectId}?`
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)

    return this.apiClient.get<GetAllWorkspaceRolesOfProjectResponse>(
      url,
      headers
    )
  }

  static async deleteEnvironment(
    request: DeleteWorkspaceRoleRequest,
    headers?: Record<string, string>
  ): Promise<DeleteWorkspaceRoleResponse> {
    return this.apiClient.delete<DeleteWorkspaceRoleResponse>(
      `/api/environment/${request.id}`,
      headers
    )
  }
}
