import { PageRequest, PageResponse } from '@keyshade/schema'

export interface Project {
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

export interface CreateProjectRequest {
  name: string
  workspaceSlug: string
  description?: string
  storePrivateKey?: boolean
  environments?: CreateEnvironment[]
  accessLevel: string
}

export interface CreateProjectResponse extends Project {}

export interface UpdateProjectRequest
  extends Partial<Omit<CreateProjectRequest, 'workspaceSlug'>> {
  projectSlug: string
  regenerateKeyPair?: boolean
  privateKey?: string
}

export interface UpdateProjectResponse extends Project {}

export interface DeleteProjectRequest {
  projectSlug: string
}

export interface DeleteProjectResponse {}

export interface GetProjectRequest {
  projectSlug: string
}

export interface GetProjectResponse extends Project {}

export interface ForkProjectRequest {
  projectSlug: string
  name?: string
  workspaceSlug?: string
  storePrivateKey?: boolean
}

export interface ForkProjectResponse extends Project {}

export interface SyncProjectRequest {
  projectSlug: string
  hardSync?: boolean
}

export interface SyncProjectResponse {}

export interface UnlinkProjectRequest {
  projectSlug: string
}

export interface UnlinkProjectResponse {}

export interface GetForkRequest extends PageRequest {
  projectSlug: string
  workspaceSlug: string
}

export interface GetForkResponse extends PageResponse<Project> {}

export interface GetAllProjectsRequest extends PageRequest {
  workspaceSlug: string
}

export interface GetAllProjectsResponse extends PageResponse<Project> {}
