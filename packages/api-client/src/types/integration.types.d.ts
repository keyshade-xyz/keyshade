import { PageRequest, PageResponse } from './index.types'

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

export interface Integration {
  id: string
  name: string
  slug: string
  metadata: Record<string, string>
  createdAt: string
  updatedAt: string
  type: IntegrationType
  notifyOn: EventType[]
  workspaceId: string
  projectId: string
  environmentId: string
}

export interface CreateIntegrationRequest {
  workspaceSlug?: string
  projectSlug?: string
  name: string
  type: string
  notifyOn: [string]
  metadata: Record<string, string>
  environmentSlug: string
}

export interface CreateIntegrationResponse extends Integration {}

export interface UpdateIntegrationRequest
  extends Partial<Omit<CreateIntegrationRequest, 'workspaceSlug'>> {
  integrationSlug: string
}

export interface UpdateIntegrationResponse extends Integration {}

export interface DeleteIntegrationResponse {}

export interface DeleteIntegrationRequest {
  integrationSlug: string
}

export interface GetIntegrationRequest {
  integrationSlug: string
}

export interface GetIntegrationResponse extends Integration {}

export interface GetAllIntegrationRequest extends PageRequest {
  workspaceSlug: string
}

export interface GetAllIntegrationResponse extends PageResponse<Integration> {}
