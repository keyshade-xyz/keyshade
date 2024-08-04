export interface CreateWorkspaceRoleRequest {
  name: string
  description?: string
  workspaceId: string
}

export interface CreateWorkspaceRoleResponse {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  lastUpdatedById: string
  workspaceId: string
}

export interface UpdateWorkspaceRoleRequest {
  id: string
  name?: string
  description?: string
}

export interface UpdateWorkspaceRoleResponse {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  lastUpdatedById: string
  workspaceId: string
}

export interface GetWorkspaceRoleByIdRequest {
  id: string
}

export interface GetWorkspaceRoleByIdResponse {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  lastUpdatedById: string
  workspaceId: string
}

export interface GetAllWorkspaceRolesOfProjectRequest {
  id: any
  workspaceId: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}

export interface GetAllWorkspaceRolesOfProjectResponse {
  items: {
    id: string
    name: string
    description: string | null
    createdAt: string
    updatedAt: string
    lastUpdatedBy: {
      id: string
      name: string
      email: string
      profilePictureUrl: string | null
    }
  }[]
}

export interface DeleteWorkspaceRoleRequest {
  id: string
}

export interface DeleteWorkspaceRoleResponse {}
