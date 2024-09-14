import { APIClient } from '@api-client/core/client'
import { parsePaginationUrl } from '@api-client/core/pagination-parser'
import { parseResponse } from '@api-client/core/response-parser'
import { ClientResponse } from '@api-client/types/index.types'
import {
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  DeleteWorkspaceRequest,
  DeleteWorkspaceResponse,
  ExportDataRequest,
  ExportDataResponse,
  GetAllWorkspacesOfUserRequest,
  GetAllWorkspacesOfUserResponse,
  GetWorkspaceRequest,
  GetWorkspaceResponse,
  GlobalSearchRequest,
  GlobalSearchResponse,
  UpdateWorkspaceRequest,
  UpdateWorkspaceResponse
} from '@api-client/types/workspace.types'

export default class WorkspaceController {
  private apiClient: APIClient

  constructor(private readonly backendUrl: string) {
    this.apiClient = new APIClient(this.backendUrl)
  }

  async createWorkspace(
    request: CreateWorkspaceRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<CreateWorkspaceResponse>> {
    const response = await this.apiClient.post(
      `/api/workspace`,
      request,
      headers
    )

    return await parseResponse<CreateWorkspaceResponse>(response)
  }

  async updateWorkspace(
    request: UpdateWorkspaceRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<UpdateWorkspaceResponse>> {
    const response = await this.apiClient.put(
      `/api/workspace/${request.workspaceSlug}`,
      request,
      headers
    )

    return await parseResponse<UpdateWorkspaceResponse>(response)
  }

  async deleteWorkspace(
    request: DeleteWorkspaceRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DeleteWorkspaceResponse>> {
    const response = await this.apiClient.delete(
      `/api/workspace/${request.workspaceSlug}`,
      headers
    )

    return await parseResponse<DeleteWorkspaceResponse>(response)
  }

  async getWorkspace(
    request: GetWorkspaceRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetWorkspaceResponse>> {
    const response = await this.apiClient.get(
      `/api/workspace/${request.workspaceSlug}`,
      headers
    )

    return await parseResponse<GetWorkspaceResponse>(response)
  }

  async getWorkspacesOfUser(
    request: GetAllWorkspacesOfUserRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetAllWorkspacesOfUserResponse>> {
    const url = parsePaginationUrl('/api/workspace', request)
    const response = await this.apiClient.get(url, headers)

    return await parseResponse<GetAllWorkspacesOfUserResponse>(response)
  }

  async exportWorkspaceData(
    request: ExportDataRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<ExportDataResponse>> {
    const response = await this.apiClient.get(
      `/api/workspace/${request.workspaceSlug}/export-data`,
      headers
    )

    return await parseResponse<ExportDataResponse>(response)
  }

  async globalSearch(
    request: GlobalSearchRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GlobalSearchResponse>> {
    const response = await this.apiClient.get(
      `/api/workspace/${request.workspaceSlug}/global-search/${request.search}`,
      headers
    )

    return await parseResponse<GlobalSearchResponse>(response)
  }
}
