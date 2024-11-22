import { ClientResponse } from '@keyshade/schema'
import { APIClient } from '@api-client/core/client'
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
  SyncProjectRequest,
  SyncProjectResponse,
  UnlinkProjectRequest,
  UnlinkProjectResponse,
  UpdateProjectRequest,
  UpdateProjectResponse
} from '@keyshade/schema'
import { parseResponse } from '@api-client/core/response-parser'
import { parsePaginationUrl } from '@api-client/core/pagination-parser'

export default class ProjectController {
  private apiClient: APIClient

  constructor(private readonly backendUrl: string) {
    this.apiClient = new APIClient(this.backendUrl)
  }

  async createProject(
    request: CreateProjectRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<CreateProjectResponse>> {
    const response = await this.apiClient.post(
      `/api/project/${request.workspaceSlug}`,
      request,
      headers
    )

    return await parseResponse<CreateProjectResponse>(response)
  }

  async updateProject(
    request: UpdateProjectRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<UpdateProjectResponse>> {
    const response = await this.apiClient.put(
      `/api/project/${request.projectSlug}`,
      request,
      headers
    )

    return await parseResponse<UpdateProjectResponse>(response)
  }

  async deleteProject(
    request: DeleteProjectRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DeleteProjectResponse>> {
    const response = await this.apiClient.delete(
      `/api/project/${request.projectSlug}`,
      headers
    )

    return await parseResponse<DeleteProjectResponse>(response)
  }

  async getProject(
    request: GetProjectRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetProjectResponse>> {
    const response = await this.apiClient.get(
      `/api/project/${request.projectSlug}`,
      headers
    )

    return await parseResponse<GetProjectResponse>(response)
  }

  async forkProject(
    request: ForkProjectRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<ForkProjectResponse>> {
    const response = await this.apiClient.post(
      `/api/project/${request.projectSlug}/fork`,
      request,
      headers
    )

    return await parseResponse<ForkProjectResponse>(response)
  }

  async syncFork(
    request: SyncProjectRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<SyncProjectResponse>> {
    const response = await this.apiClient.put(
      `/api/project/${request.projectSlug}/fork?hardSync=${request.hardSync}`,
      request,
      headers
    )

    return await parseResponse<SyncProjectResponse>(response)
  }

  async unlinkFork(
    request: UnlinkProjectRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<UnlinkProjectResponse>> {
    const response = await this.apiClient.delete(
      `/api/project/${request.projectSlug}/fork`,
      headers
    )

    return await parseResponse<UnlinkProjectResponse>(response)
  }

  async getForks(
    request: GetForkRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetForkResponse>> {
    const url = parsePaginationUrl(
      `/api/project/${request.projectSlug}/forks`,
      request
    )
    const response = await this.apiClient.get(url, headers)

    return await parseResponse<GetForkResponse>(response)
  }

  async getAllProjects(
    request: GetAllProjectsRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetAllProjectsResponse>> {
    
    const url = parsePaginationUrl(
      `/api/project/all/${request.workspaceSlug}`,
      request
    )
    const response = await this.apiClient.get(url, headers)

    return await parseResponse<GetAllProjectsResponse>(response)
  }
}
