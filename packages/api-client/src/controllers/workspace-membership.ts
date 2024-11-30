import { APIClient } from '@api-client/core/client'
import { parseResponse } from '@api-client/core/response-parser'
import { parsePaginationUrl } from '@api-client/core/pagination-parser'
import {
  TransferOwnershipRequest,
  TransferOwnershipResponse,
  InviteUsersRequest,
  InviteUsersResponse,
  RemoveUsersRequest,
  RemoveUsersResponse,
  UpdateMemberRoleRequest,
  UpdateMemberRoleResponse,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  DeclineInvitationRequest,
  DeclineInvitationResponse,
  CancelInvitationRequest,
  CancelInvitationResponse,
  LeaveWorkspaceRequest,
  LeaveWorkspaceResponse,
  IsMemberRequest,
  IsMemberResponse,
  GetMembersRequest,
  GetMembersResponse
} from '@keyshade/schema'
import { ClientResponse } from '@keyshade/schema'

export default class WorkspaceMembershipController {
  private apiClient: APIClient

  constructor(private readonly backendUrl: string) {
    this.apiClient = new APIClient(this.backendUrl)
  }

  async transferOwnership(
    request: TransferOwnershipRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<TransferOwnershipResponse>> {
    const response = await this.apiClient.put(
      `/api/workspace-membership/${request.workspaceSlug}/transfer-ownership/${request.userEmail}`,
      request,
      headers
    )
    return await parseResponse<TransferOwnershipResponse>(response)
  }

  async inviteUsers(
    request: InviteUsersRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<InviteUsersResponse>> {
    const response = await this.apiClient.post(
      `/api/workspace-membership/${request.workspaceSlug}/invite-users`,
      request,
      headers
    )
    return await parseResponse<InviteUsersResponse>(response)
  }

  async removeUsers(
    request: RemoveUsersRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<RemoveUsersResponse>> {
    const response = await this.apiClient.delete(
      `/api/workspace-membership/${request.workspaceSlug}/remove-users`,
      headers
    )
    return await parseResponse<RemoveUsersResponse>(response)
  }

  async updateMemberRoles(
    request: UpdateMemberRoleRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<UpdateMemberRoleResponse>> {
    const response = await this.apiClient.put(
      `/api/workspace-membership/${request.workspaceSlug}/update-member-role/${request.userEmail}`,
      request,
      headers
    )
    return await parseResponse<UpdateMemberRoleResponse>(response)
  }

  async acceptInvitation(
    request: AcceptInvitationRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<AcceptInvitationResponse>> {
    const response = await this.apiClient.post(
      `/api/workspace-membership/${request.workspaceSlug}/accept-invitation`,
      request,
      headers
    )
    return await parseResponse<AcceptInvitationResponse>(response)
  }

  async declineInvitation(
    request: DeclineInvitationRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<DeclineInvitationResponse>> {
    const response = await this.apiClient.delete(
      `/api/workspace-membership/${request.workspaceSlug}/decline-invitation`,
      headers
    )
    return await parseResponse<DeclineInvitationResponse>(response)
  }

  async cancelInvitation(
    request: CancelInvitationRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<CancelInvitationResponse>> {
    const response = await this.apiClient.delete(
      `/api/workspace-membership/${request.workspaceSlug}/cancel-invitation/${request.userEmail}`,
      headers
    )
    return await parseResponse<CancelInvitationResponse>(response)
  }

  async leaveWorkspace(
    request: LeaveWorkspaceRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<LeaveWorkspaceResponse>> {
    const response = await this.apiClient.delete(
      `/api/workspace-membership/${request.workspaceSlug}/leave`,
      headers
    )
    return await parseResponse<LeaveWorkspaceResponse>(response)
  }

  async isMember(
    request: IsMemberRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<IsMemberResponse>> {
    const response = await this.apiClient.get(
      `/api/workspace-membership/${request.workspaceSlug}/is-member/${request.userEmail}`,
      headers
    )
    return await parseResponse<IsMemberResponse>(response)
  }

  async getMembers(
    request: GetMembersRequest,
    headers?: Record<string, string>
  ): Promise<ClientResponse<GetMembersResponse>> {
    const url = parsePaginationUrl(
      `/api/workspace-membership/${request.workspaceSlug}/members`,
      request
    )
    const response = await this.apiClient.get(url, headers)
    return await parseResponse<GetMembersResponse>(response)
  }
}
