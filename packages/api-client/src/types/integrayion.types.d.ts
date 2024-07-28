export interface CreateIntegrationRequest {
  workspaceId: string
}

export interface CreateIntegrationResponse {}

export interface UpdateIntegrationRequest {
  workspaceId: string
}

export interface UpdateIntegrationResponse {}

export interface DeleteIntegrationResponse {}

export interface DeleteIntegrationRequest {
  integrationId: string
}

export interface GetIntegrationRequest {
  integrationId: string
}

export interface GetIntegrationResponse {}

export interface GetAllIntegrationRequest {
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
  workspaceId: string
}

export interface GetAllIntegrationResponse {}
