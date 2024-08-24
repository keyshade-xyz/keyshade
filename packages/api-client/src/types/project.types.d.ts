import { Page } from './index.types'

export interface CreateProjectRequest {
  name: string
  workspaceId: string
  description?: string
  storePrivateKey?: boolean
  environments?: CreateEnvironment[]
  accessLevel: string
}

export interface CreateProjectResponse {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  publicKey: string
  privateKey: string
  storePrivateKey: boolean
  isDisabled: boolean
  accessLevel: string
  pendingCreation: boolean
  isForked: boolean
  lastUpdatedById: string
  workspaceId: string
  forkedFromId: string
}

export interface UpdateProjectRequest {
  projectId: string
  name?: string
}

export interface UpdateProjectResponse {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  publicKey: string
  privateKey: string
  storePrivateKey: boolean
  isDisabled: boolean
  accessLevel: string
  pendingCreation: boolean
  isForked: boolean
  lastUpdatedById: string
  workspaceId: string
  forkedFromId: string
}

export interface DeleteProjectRequest {
  projectId: string
}

export interface DeleteProjectResponse {}

export interface GetProjectRequest {
  projectId: string
}

export interface GetProjectResponse {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  publicKey: string
  privateKey: string
  storePrivateKey: boolean
  isDisabled: boolean
  accessLevel: string
  pendingCreation: boolean
  isForked: boolean
  lastUpdatedById: string
  workspaceId: string
  forkedFromId: string
}

export interface ForkProjectRequest {
  projectId: string
  name?: string
  workspaceId?: string
  storePrivateKey?: boolean
}

export interface ForkProjectResponse {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  publicKey: string
  privateKey: string
  storePrivateKey: boolean
  isDisabled: boolean
  accessLevel: string
  pendingCreation: boolean
  isForked: boolean
  lastUpdatedById: string
  workspaceId: string
  forkedFromId: string
}

export interface SyncProjectRequest {
  projectId: string
}

export interface SyncProjectResponse {}

export interface UnlinkProjectRequest {
  projectId: string
  workspaceId: string
}

export interface UnlinkProjectResponse {}

export interface GetForkRequest {
  projectId: string
  workspaceId: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}

export interface GetForkResponse
  extends Page<{
    id: string
    name: string
    description: string
    createdAt: string
    updatedAt: string
    publicKey: string
    privateKey: string
    storePrivateKey: boolean
    isDisabled: boolean
    accessLevel: string
    pendingCreation: boolean
    isForked: boolean
    lastUpdatedById: string
    workspaceId: string
    forkedFromId: string
  }> {}

export interface GetAllProjectsRequest {
  workspaceId: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}

export interface GetAllProjectsResponse
  extends Page<{
    id: string
    name: string
  }> {}
