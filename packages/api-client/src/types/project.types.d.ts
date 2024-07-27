export interface CreateProjectRequest {
  name: string
  workspaceId: string
  description?: string
  storePrivateKey?: boolean
  environments?: CreateEnvironment[]
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
  name: string
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

export interface SyncProjectRequest {}

export interface SyncProjectResponse {}

export interface UnlinkProjectRequest {
  projectId: string
}

export interface UnlinkProjectResponse {}

export interface GetForkRequest {
  projectId: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}

export interface GetForkResponse {
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
export interface GetAllProjectsRequest {
  projectId: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}

export interface GetAllProjectsResponse {}
