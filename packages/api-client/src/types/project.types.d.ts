export interface CreateProjectRequest {
  name: string
  workspaceId: string
  description?: string
  storePrivateKey?: boolean
  environments?: CreateEnvironment[]
}

export interface CreateProjectResponse {}

export interface UpdateProjectRequest {
  projectId: string
  name?: string
}

export interface UpdateProjectResponse {}

export interface DeleteProjectRequest {
  projectId: string
}

export interface DeleteProjectResponse {}

export interface GetProjectRequest {
  projectId: string
}

export interface GetProjectResponse {}

export interface ForkProjectRequest {
  projectId: string
  name: string
}

export interface ForkProjectResponse {}

export interface SyncProjectRequest {}

export interface SyncProjectResponse {}

export interface UnlinkProjectRequest {
  projectId: string
}

export interface UnlinkProjectResponse {}

export interface GetForkRequest {
  projectId: string
}

export interface GetForkResponse {}
export interface GetAllProjectsRequest {
  projectId: string
}

export interface GetAllProjectsResponse {}
