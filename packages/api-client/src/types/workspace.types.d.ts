import { PageRequest, PageResponse } from './index.types'

interface Workspace {
  id: string
  name: string
  slug: string
  icon: string
  isFreeTier: boolean
  createdAt: string
  updatedAt: string
  ownerId: string
  isDefault: boolean
  lastUpdatedBy: string
}

export interface CreateWorkspaceRequest {
  name: string
  icon?: string
}

export interface CreateWorkspaceResponse extends Workspace {}

export interface UpdateWorkspaceRequest
  extends Partial<CreateWorkspaceRequest> {
  workspaceSlug: string
}

export interface UpdateWorkspaceResponse extends Workspace {}

export interface DeleteWorkspaceRequest {
  workspaceSlug: string
}

export interface DeleteWorkspaceResponse {}

export interface GetWorkspaceRequest {
  workspaceSlug: string
}

export interface GetWorkspaceResponse extends Workspace {}

export interface GetAllWorkspacesOfUserRequest extends PageRequest {}

export interface GetAllWorkspacesOfUserResponse
  extends PageResponse<Workspace> {}

export interface ExportDataRequest {
  workspaceSlug: string
}

export interface ExportDataResponse {
  name: string
  icon: string
  workspaceRoles: {
    name: string
    description: string
    colorCode: string
    hasAdminAuthority: boolean
    authorities: string[]
  }[]
  projects: {
    name: string
    description: string
    publicKey: string
    privateKey: string
    storePrivateKey: boolean
    accessLevel: 'GLOBAL' | 'PRIVATE' | 'INTERNAL'
    environments: {
      name: string
      description: string
    }[]
    secrets: {
      name: string
      note: string
      rotateAt: string
      versions: {
        value: string
        version: number
      }[]
    }[]
    variables: {
      name: string
      note: string
      versions: {
        value: string
        version: number
      }[]
    }[]
  }[]
}

export interface GlobalSearchRequest {
  workspaceSlug: string
  search: string
}

export interface GlobalSearchResponse {
  projects: {
    id: string
    name: string
    description: string
  }[]
  environments: {
    id: string
    name: string
    description: string
  }[]
  secrets: {
    id: string
    name: string
    note: string
  }[]
  variables: {
    id: string
    name: string
    note: string
  }[]
}
