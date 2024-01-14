import { ApiKeyProjectRole } from '@prisma/client'
import { ProjectRole } from '@prisma/client'

export const ApiKeyProjectRoles: { [key in ProjectRole]: ApiKeyProjectRole[] } =
  {
    [ProjectRole.VIEWER]: [
      ApiKeyProjectRole.READ_PROJECT,
      ApiKeyProjectRole.READ_SECRET,
      ApiKeyProjectRole.READ_ENVIRONMENT,
      ApiKeyProjectRole.READ_USERS
    ],
    [ProjectRole.MAINTAINER]: [
      ApiKeyProjectRole.CREATE_SECRET,
      ApiKeyProjectRole.UPDATE_SECRET,
      ApiKeyProjectRole.DELETE_SECRET,
      ApiKeyProjectRole.CREATE_ENVIRONMENT,
      ApiKeyProjectRole.UPDATE_ENVIRONMENT,
      ApiKeyProjectRole.DELETE_ENVIRONMENT
    ],
    [ProjectRole.OWNER]: [
      ApiKeyProjectRole.UPDATE_PROJECT,
      ApiKeyProjectRole.DELETE_PROJECT,
      ApiKeyProjectRole.ADD_USER,
      ApiKeyProjectRole.REMOVE_USER,
      ApiKeyProjectRole.UPDATE_USER_ROLE
    ]
  }
