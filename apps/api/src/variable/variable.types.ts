import {
  Environment,
  Project,
  User,
  Variable,
  VariableVersion
} from '@prisma/client'

export interface HydratedVariableRevision {
  environment: {
    id: Environment['id']
    name: Environment['name']
    slug: Environment['slug']
    maxAllowedRevisions: number
    totalRevisions: number
  }
  value: VariableVersion['value']
  version: VariableVersion['version']
  createdOn: VariableVersion['createdOn']
  createdBy: {
    id: User['id']
    name: User['name']
    profilePictureUrl: User['profilePictureUrl']
  }
}

export interface RawVariableRevision
  extends Omit<HydratedVariableRevision, 'environment'> {
  environment: {
    id: Environment['id']
    name: Environment['name']
    slug: Environment['slug']
  }
}

export interface HydratedVariable extends Variable {
  lastUpdatedBy: {
    id: User['id']
    name: User['name']
    profilePictureUrl: User['profilePictureUrl']
  }
  entitlements: {
    canUpdate: boolean
    canDelete: boolean
  }
  project: {
    id: Project['id']
    name: Project['name']
    slug: Project['slug']
    workspaceId: Project['workspaceId']
  }
  versions: Array<HydratedVariableRevision>
}

export interface RawVariable
  extends Omit<HydratedVariable, 'entitlements' | 'versions'> {
  versions: Array<RawVariableRevision>
}
