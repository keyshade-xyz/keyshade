export interface CreateIntegrationRequest {
  workspaceId: string
  projectId: string
  name: string
  type: string
  notifyOn: [string]
  metadata: any
  environmentId: string
}

export interface CreateIntegrationResponse {
  id: string
  name: string
  metadata: any
  createdAt: string
  updatedAt: string
  type: string
  notifyOn: [string]
  workspaceId: string
  projectId: string
  environmentId: string
}

export interface UpdateIntegrationRequest {
  integrationId: string
  name: string
}

export interface UpdateIntegrationResponse {
  id: string
  name: string
  metadata: any
  createdAt: string
  updatedAt: string
  type: string
  notifyOn: [string]
  workspaceId: string
  projectId: string
  environmentId: string
}

export interface DeleteIntegrationResponse {}

export interface DeleteIntegrationRequest {
  integrationId: string
}

export interface GetIntegrationRequest {
  integrationId: string
}

export interface GetIntegrationResponse {
  id: string
  name: string
  metadata: any
  createdAt: string
  updatedAt: string
  type: string
  notifyOn: [string]
  workspaceId: string
  projectId: string
  environmentId: string
}

export interface GetAllIntegrationRequest {
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
  workspaceId: string
}

export interface GetAllIntegrationResponse {
  items: {
    id: string
    name: string
    metadata: any
    createdAt: string
    updatedAt: string
    type: string
    notifyOn: [string]
    workspaceId: string
    projectId: string
    environmentId: string
  }[]
}
