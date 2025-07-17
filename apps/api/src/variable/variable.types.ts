import {
  Environment,
  Project,
  User,
  Variable,
  VariableVersion
} from '@prisma/client'

export interface VariableRevision {
  environment: {
    id: Environment['id']
    name: Environment['name']
    slug: Environment['slug']
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
  versions: Array<VariableRevision>
}

export interface RawVariable extends Omit<HydratedVariable, 'entitlements'> {
  versions: HydratedVariable['versions']
}

export interface RawEntitledVariable extends RawVariable {
  entitlements: HydratedVariable['entitlements']
}
