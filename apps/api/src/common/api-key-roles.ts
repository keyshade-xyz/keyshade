import { ApiKeyWorkspaceRole, WorkspaceRole } from '@prisma/client'

export const ApiKeyWorkspaceRoles: {
  [key in WorkspaceRole]: ApiKeyWorkspaceRole[]
} = {
  [WorkspaceRole.VIEWER]: [
    ApiKeyWorkspaceRole.READ_PROJECT,
    ApiKeyWorkspaceRole.READ_SECRET,
    ApiKeyWorkspaceRole.READ_ENVIRONMENT,
    ApiKeyWorkspaceRole.READ_USERS
  ],
  [WorkspaceRole.MAINTAINER]: [
    ApiKeyWorkspaceRole.CREATE_SECRET,
    ApiKeyWorkspaceRole.UPDATE_SECRET,
    ApiKeyWorkspaceRole.DELETE_SECRET,
    ApiKeyWorkspaceRole.CREATE_ENVIRONMENT,
    ApiKeyWorkspaceRole.UPDATE_ENVIRONMENT,
    ApiKeyWorkspaceRole.DELETE_ENVIRONMENT
  ],
  [WorkspaceRole.OWNER]: [
    ApiKeyWorkspaceRole.UPDATE_PROJECT,
    ApiKeyWorkspaceRole.DELETE_PROJECT,
    ApiKeyWorkspaceRole.ADD_USER,
    ApiKeyWorkspaceRole.REMOVE_USER,
    ApiKeyWorkspaceRole.UPDATE_USER_ROLE
  ]
}
