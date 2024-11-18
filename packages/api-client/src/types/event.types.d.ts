import { PageResponse } from '@keyshade/schema'

export enum EventSource {
  SECRET,
  VARIABLE,
  ENVIRONMENT,
  PROJECT,
  WORKSPACE,
  WORKSPACE_ROLE,
  INTEGRATION
}

export enum EventTriggerer {
  USER,
  SYSTEM
}

export enum EventSeverity {
  INFO,
  WARN,
  ERROR
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

export interface GetEventsRequest {
  workspaceSlug: string
  source: string
}

export interface GetEventsResponse
  extends PageResponse<{
    id: string
    source: EventSource
    triggerer: EventTriggerer
    severity: EventSeverity
    type: EventType
    timestamp: string
    metadata: {
      name: string
      projectName: string
      projectId?: string
      variableId?: string
      environmentId?: string
      secretId?: string
      workspaceId?: string
      workspaceName?: string
    }
    title: string
    description: string
    itemId: string
    userId: string
    workspaceId: string
  }> {}
