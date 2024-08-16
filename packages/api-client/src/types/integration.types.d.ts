import { Page } from '../../../../apps/cli/src/types/index.types'
export enum IntegrationType {
  DISCORD,
  SLACK,
  GITHUB,
  GITLAB
}

export enum EventType {
  INVITED_TO_WORKSPACE,
  REMOVED_FROM_WORKSPACE,
  ACCEPTED_INVITATION,
  DECLINED_INVITATION,
  CANCELLED_INVITATION,
  LEFT_WORKSPACE,
  WORKSPACE_MEMBERSHIP_UPDATED,
  WORKSPACE_UPDATED,
  WORKSPACE_CREATED,
  WORKSPACE_ROLE_CREATED,
  WORKSPACE_ROLE_UPDATED,
  WORKSPACE_ROLE_DELETED,
  PROJECT_CREATED,
  PROJECT_UPDATED,
  PROJECT_DELETED,
  SECRET_UPDATED,
  SECRET_DELETED,
  SECRET_ADDED,
  VARIABLE_UPDATED,
  VARIABLE_DELETED,
  VARIABLE_ADDED,
  ENVIRONMENT_UPDATED,
  ENVIRONMENT_DELETED,
  ENVIRONMENT_ADDED,
  INTEGRATION_ADDED,
  INTEGRATION_UPDATED,
  INTEGRATION_DELETED
}
export interface CreateIntegrationRequest {
  workspaceId?: string
  projectId?: string
  name: string
  type: string
  notifyOn: [string]
  metadata: Record<string, string>
  environmentId: string
}

export interface CreateIntegrationResponse {
  id: string
  name: string
  metadata: Record<string, string>
  createdAt: string
  updatedAt: string
  type: IntegrationType
  notifyOn: EventType[]
  workspaceId: string
  projectId: string
  environmentId: string
}

export interface UpdateIntegrationRequest {
  integrationId: string
  workspaceId?: string
  projectId?: string
  name?: string
  type?: IntegrationType
  notifyOn?: EventType[]
  metadata?: Record<string, string>
  environmentId?: string
}

export interface UpdateIntegrationResponse {
  id: string
  name: string
  metadata: Record<string, string>
  createdAt: string
  updatedAt: string
  type: IntegrationType
  notifyOn: EventType[]
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
  metadata: Record<string, string>
  createdAt: string
  updatedAt: string
  type: IntegrationType
  notifyOn: EventType[]
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

export interface GetAllIntegrationResponse
  extends Page<{
    id: string
    name: string
    metadata: Record<string, string>
    createdAt: string
    updatedAt: string
    type: IntegrationType
    notifyOn: EventType[]
    workspaceId: string
    projectId: string
    environmentId: string
  }> {}
