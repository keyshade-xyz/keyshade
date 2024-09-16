import { PageRequest, PageResponse } from './index.types'

interface WorkspaceRole {
  id: string
  name: string
  slug: string
  description: string
  colorCode: string
  hasAdminAuthority: boolean
  createdAt: string
  updatedAt: string
  authorities: string[]
  workspaceId: string
  projects: {
    project: {
      id: string
      name: string
      slug: string
    }[]
  }[]
}

export interface CreateWorkspaceRoleRequest {
  workspaceSlug: string
  name: string
  description?: string
  colorCode?: string
  authorities: string[]
  projectSlugs: string[]
}

export interface CreateWorkspaceRoleResponse extends WorkspaceRole {}

export interface UpdateWorkspaceRoleRequest
  extends Partial<Omit<CreateWorkspaceRoleRequest, 'workspaceSlug'>> {
  workspaceRoleSlug: string
}

export interface UpdateWorkspaceRoleResponse extends WorkspaceRole {}

export interface DeleteWorkspaceRoleRequest {
  workspaceRoleSlug: string
}

export interface DeleteWorkspaceRoleResponse {}

export interface CheckWorkspaceRoleExistsRequest {
  workspaceSlug: string
  workspaceRoleName: string
}

export interface CheckWorkspaceRoleExistsResponse {
  exists: boolean
}

export interface GetWorkspaceRoleRequest {
  workspaceRoleSlug: string
}

export interface GetWorkspaceRoleResponse extends WorkspaceRole {}

export interface GetWorkspaceRolesOfWorkspaceRequest extends PageRequest {
  workspaceSlug: string
}

export interface GetWorkspaceRolesOfWorkspaceResponse
  extends PageResponse<Omit<WorkspaceRole, 'projects'>> {}
