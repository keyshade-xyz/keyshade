import { Page } from './index.types'

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
    projectId: string
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

export interface CheckWOrkspaceRoleExistsRequest {
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

export interface GetWorkspaceRolesOfWorkspaceRequest {
  workspaceSlug: string
  page: number
  limit: number
  sort: string
  order: string
  search: string
}

export interface GetWorkspaceRolesOfWorkspaceResponse
  extends Page<Omit<WorkspaceRole, 'projects'>> {}
