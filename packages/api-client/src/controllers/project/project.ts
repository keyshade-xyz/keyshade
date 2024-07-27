import client from '@package/client'
import {
  CreateProjectRequest,
  DeleteProjectRequest,
  ForkProjectRequest,
  GetAllProjectsRequest,
  GetForkRequest,
  GetProjectRequest,
  UnlinkProjectRequest,
  UpdateProjectRequest
} from '@package/types/project.types'

export default class ProjectController {
  private static apiClient = client

  static async createProject(
    request: CreateProjectRequest,
    headers: any
  ): Promise<any> {
    return this.apiClient.post(
      `/api/project/${request.workspaceId}`,
      request,
      headers
    )
  }

  static async updateProject(
    request: UpdateProjectRequest,
    headers: any
  ): Promise<any> {
    return this.apiClient.put(
      `/api/project/${request.projectId}`,
      request,
      headers
    )
  }

  static async deleteProject(
    request: DeleteProjectRequest,
    headers: any
  ): Promise<any> {
    return this.apiClient.delete(`/api/project/${request.projectId}`, headers)
  }

  static async getProject(
    request: GetProjectRequest,
    headers: any
  ): Promise<any> {
    return this.apiClient.get(`/api/project/${request.projectId}`, headers)
  }

  static async forkProject(
    request: ForkProjectRequest,
    headers: any
  ): Promise<any> {
    return this.apiClient.post(
      `/api/project/${request.projectId}/fork`,
      request,
      headers
    )
  }

  static async syncFork() {}

  static async unlinkFork(
    request: UnlinkProjectRequest,
    headers: any
  ): Promise<any> {
    return this.apiClient.put(
      `/api/project/${request.projectId}/unlink-fork`,
      request,
      headers
    )
  }

  static async getForks(request: GetForkRequest, headers: any): Promise<any> {
    return this.apiClient.get(
      `/api/project/${request.projectId}/forks`,
      headers
    )
  }

  static async getAllProjects(
    request: GetAllProjectsRequest,
    headers: any
  ): Promise<any> {
    return this.apiClient.get(`/api/project/all/${request.projectId}`, headers)
  }
}
