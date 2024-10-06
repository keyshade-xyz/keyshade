import { Page } from '../../../../apps/cli/src/types/index.types'

enum Authority {
  CREATE_PROJECT,
  READ_USERS,
  ADD_USER,
  REMOVE_USER,
  UPDATE_USER_ROLE,
  READ_WORKSPACE,
  UPDATE_WORKSPACE,
  DELETE_WORKSPACE,
  CREATE_WORKSPACE_ROLE,
  READ_WORKSPACE_ROLE,
  UPDATE_WORKSPACE_ROLE,
  DELETE_WORKSPACE_ROLE,
  WORKSPACE_ADMIN,
  READ_PROJECT,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  CREATE_SECRET,
  READ_SECRET,
  UPDATE_SECRET,
  DELETE_SECRET,
  CREATE_ENVIRONMENT,
  READ_ENVIRONMENT,
  UPDATE_ENVIRONMENT,
  DELETE_ENVIRONMENT,
  CREATE_VARIABLE,
  READ_VARIABLE,
  UPDATE_VARIABLE,
  DELETE_VARIABLE,
  CREATE_INTEGRATION,
  READ_INTEGRATION,
  UPDATE_INTEGRATION,
  DELETE_INTEGRATION,
  CREATE_WORKSPACE,
  CREATE_API_KEY,
  READ_API_KEY,
  UPDATE_API_KEY,
  DELETE_API_KEY,
  UPDATE_PROFILE,
  READ_SELF,
  UPDATE_SELF,
  READ_EVENT
}

export interface CreateWorkspaceMember {
  email: string
  roleSlugs: string[]
}

export interface TransferOwnershipRequest {
  workspaceSlug: string
  userEmail: string
}

export interface TransferOwnershipResponse {}

export interface InviteUsersRequest {
  emails: string[]
  workspaceSlug: string
  members: CreateWorkspaceMember[]
}

export interface InviteUsersResponse {}

export interface RemoveUsersRequest {
  workspaceSlug: string
  userEmails: string[]
}

export interface RemoveUsersResponse {}

export interface UpdateMemberRoleRequest {
  workspaceSlug: string
  userEmail: string
  roleSlugs: string[]
}

export interface UpdateMemberRoleResponse {}

export interface AcceptInvitationRequest {
  workspaceSlug: string
}

export interface AcceptInvitationResponse {}

export interface DeclineInvitationRequest {
  workspaceSlug: string
}

export interface DeclineInvitationResponse {}

export interface CancelInvitationRequest {
  workspaceSlug: string
  userEmail: string
}

export interface CancelInvitationResponse {}

export interface LeaveWorkspaceRequest {
  workspaceSlug: string
}

export interface LeaveWorkspaceResponse {}

export interface IsMemberRequest {
  workspaceSlug: string
  userEmail: string
}

export type IsMemberResponse = boolean

export interface GetMembersRequest extends Page {
  workspaceSlug: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}

export interface GetMembersResponse
  extends Page<{
    metadata: Record<string, string>
    id: string
    user: {
      id: string
      email: string
      name: string | null
    }
    roles: {
      id: string
      role: {
        id: string
        name: string
        description: string | null
        colorCode: string | null
        authorities: Authority[]
        projects: {
          id: string
        }[]
      }
    }[]
  }> {}
