import { ApiKeyProjectRole } from '@prisma/client'

export const MEMBERSHIP_ROLES: ApiKeyProjectRole[] = [
  ApiKeyProjectRole.READ_PROJECT,
  ApiKeyProjectRole.READ_SECRET,
  ApiKeyProjectRole.READ_ENVIRONMENT,
  ApiKeyProjectRole.READ_USERS
]

export const MAINTAINER_ROLES: ApiKeyProjectRole[] = [
  ApiKeyProjectRole.CREATE_SECRET,
  ApiKeyProjectRole.UPDATE_SECRET,
  ApiKeyProjectRole.DELETE_SECRET,
  ApiKeyProjectRole.CREATE_ENVIRONMENT,
  ApiKeyProjectRole.UPDATE_ENVIRONMENT,
  ApiKeyProjectRole.DELETE_ENVIRONMENT
]

export const OWNER_ROLES: ApiKeyProjectRole[] = [
  ApiKeyProjectRole.UPDATE_PROJECT,
  ApiKeyProjectRole.DELETE_PROJECT,
  ApiKeyProjectRole.ADD_USER,
  ApiKeyProjectRole.REMOVE_USER,
  ApiKeyProjectRole.UPDATE_USER_ROLE
]
