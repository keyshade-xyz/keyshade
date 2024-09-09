import { Page } from './index.types'

export interface CreateProjectRequest {
  name: string
  workspaceSlug: string
  description?: string
  storePrivateKey?: boolean
  environments?: CreateEnvironment[]
  accessLevel: string
}

export interface CreateProjectResponse {
  id: string
  name: string
  slug: string
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
  projectSlug: string
  name?: string
}

export interface UpdateProjectResponse {
  id: string
  name: string
  slug: string
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
  projectSlug: string
}

export interface DeleteProjectResponse {}

export interface GetProjectRequest {
  projectSlug: string
}

export interface GetProjectResponse {
  id: string
  name: string
  slug: string
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
  projectSlug: string
  name?: string
  workspaceSlug?: string
  storePrivateKey?: boolean
}

export interface ForkProjectResponse {
  id: string
  name: string
  slug: string
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
  projectSlug: string
}

export interface SyncProjectResponse {}

export interface UnlinkProjectRequest {
  projectSlug: string
  workspaceSlug: string
}

export interface UnlinkProjectResponse {}

export interface GetForkRequest {
  projectSlug: string
  workspaceSlug: string
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
    slug: string
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
  workspaceSlug: string
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
    slug: string
    description: string
    createdAt: string
    updatedAt: string
    storePrivateKey: boolean
    isDisabled: boolean
    accessLevel: string
    pendingCreation: boolean
    isForked: boolean
    lastUpdatedById: string
    workspaceId: string
    forkedFromId: string
  }> {}
