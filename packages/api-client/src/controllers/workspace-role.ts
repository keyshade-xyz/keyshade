import { APIClient } from '@api-client/core/client'
import { parseResponse } from '@api-client/core/response-parser'
import { ClientResponse } from '@api-client/types/index.types'
import {
  CreateWorkspaceRoleRequest,
  CreateWorkspaceRoleResponse,
  UpdateWorkspaceRoleRequest,
  UpdateWorkspaceRoleResponse,
  DeleteWorkspaceRoleRequest,
  DeleteWorkspaceRoleResponse,
  CheckWorkspaceRoleExistsResponse,
  GetWorkspaceRoleRequest,
  GetWorkspaceRoleResponse,
  GetWorkspaceRolesOfWorkspaceRequest,
  GetWorkspaceRolesOfWorkspaceResponse,
  CheckWOrkspaceRoleExistsRequest
} from '@api-client/types/workspace-role.types'

export default class WorkspaceRoleController {
  private apiClient: APIClient

  constructor(private readonly backendUrl: string) {
    this.apiClient = new APIClient(this.backendUrl)
  }

  async createWorkspaceRole(
    request: CreateWorkspaceRoleRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<CreateWorkspaceRoleResponse>> {
    const response = await this.apiClient.post(
      `/api/workspace-role/${request.workspaceSlug}`,
      request,
      headers
    )

    return await parseResponse<CreateWorkspaceRoleResponse>(response)
  }

  async updateWorkspaceRole(
    request: UpdateWorkspaceRoleRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<UpdateWorkspaceRoleResponse>> {
    const response = await this.apiClient.put(
      `/api/workspace-role/${request.workspaceRoleSlug}`,
      request,
      headers
    )

    return await parseResponse<UpdateWorkspaceRoleResponse>(response)
  }

  async deleteWorkspaceRole(
    request: DeleteWorkspaceRoleRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DeleteWorkspaceRoleResponse>> {
    const response = await this.apiClient.delete(
      `/api/workspace-role/${request.workspaceRoleSlug}`,
      headers
    )

    return await parseResponse<DeleteWorkspaceRoleResponse>(response)
  }

  async checkWorkspaceRoleExists(
    request: CheckWOrkspaceRoleExistsRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<CheckWorkspaceRoleExistsResponse>> {
    const response = await this.apiClient.get(
      `/api/workspace-role/${request.workspaceSlug}/exists/${request.workspaceRoleName}`,
      headers
    )

    return await parseResponse<CheckWorkspaceRoleExistsResponse>(response)
  }

  async getWorkspaceRole(
    request: GetWorkspaceRoleRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetWorkspaceRoleResponse>> {
    const response = await this.apiClient.get(
      `/api/workspace-role/${request.workspaceRoleSlug}`,
      headers
    )

    return await parseResponse<GetWorkspaceRoleResponse>(response)
  }

  async getWorkspaceRolesOfWorkspace(
    request: GetWorkspaceRolesOfWorkspaceRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetWorkspaceRolesOfWorkspaceResponse>> {
    let url = `/api/workspace-role/${request.workspaceSlug}/all?`
    request.page && (url += `page=${request.page}&`)
    request.limit && (url += `limit=${request.limit}&`)
    request.sort && (url += `sort=${request.sort}&`)
    request.order && (url += `order=${request.order}&`)
    request.search && (url += `search=${request.search}&`)
    const response = await this.apiClient.get(url, headers)

    return await parseResponse<GetWorkspaceRolesOfWorkspaceResponse>(response)
  }
}
