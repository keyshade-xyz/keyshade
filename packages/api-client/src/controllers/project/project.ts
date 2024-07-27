import client from '@package/client'
import {
  CreateProjectRequest,
  CreateProjectResponse,
  DeleteProjectRequest,
  DeleteProjectResponse,
  ForkProjectRequest,
  ForkProjectResponse,
  GetAllProjectsRequest,
  GetAllProjectsResponse,
  GetForkRequest,
  GetForkResponse,
  GetProjectRequest,
  GetProjectResponse,
  UnlinkProjectRequest,
  UnlinkProjectResponse,
  UpdateProjectRequest,
  UpdateProjectResponse
} from '@package/types/project.types'

export default class ProjectController {
  private static apiClient = client

  static async createProject(
    request: CreateProjectRequest,
    headers: Record<string, string>
  ): Promise<CreateProjectResponse> {
    return this.apiClient.post<CreateProjectResponse>(
      `/api/project/${request.workspaceId}`,
      request,
      headers
    )
  }

  static async updateProject(
    request: UpdateProjectRequest,
    headers: Record<string, string>
  ): Promise<UpdateProjectResponse> {
    return this.apiClient.put<UpdateProjectResponse>(
      `/api/project/${request.projectId}`,
      request,
      headers
    )
  }

  static async deleteProject(
    request: DeleteProjectRequest,
    headers: Record<string, string>
  ): Promise<DeleteProjectResponse> {
    return this.apiClient.delete(`/api/project/${request.projectId}`, headers)
  }

  static async getProject(
    request: GetProjectRequest,
    headers: Record<string, string>
  ): Promise<GetProjectResponse> {
    return this.apiClient.get<GetProjectResponse>(
      `/api/project/${request.projectId}`,
      headers
    )
  }

  static async forkProject(
    request: ForkProjectRequest,
    headers: Record<string, string>
  ): Promise<ForkProjectResponse> {
    return this.apiClient.post<ForkProjectResponse>(
      `/api/project/${request.projectId}/fork`,
      request,
      headers
    )
  }

  static async syncFork() {}

  static async unlinkFork(
    request: UnlinkProjectRequest,
    headers: Record<string, string>
  ): Promise<UnlinkProjectResponse> {
    return this.apiClient.delete(
      `/api/project/${request.projectId}/fork`,
      headers
    )
  }

  static async getForks(
    request: GetForkRequest,
    headers: Record<string, string>
  ): Promise<[GetForkResponse]> {
    let url = `/api/project/${request.projectId}/forks`
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)
    return this.apiClient.get(url, headers)
  }

  static async getAllProjects(
    request: GetAllProjectsRequest,
    headers: Record<string, string>
  ): Promise<[GetAllProjectsResponse]> {
    let url = `/api/project/all/${request.projectId}`
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)
    return this.apiClient.get(url, headers)
  }
}
