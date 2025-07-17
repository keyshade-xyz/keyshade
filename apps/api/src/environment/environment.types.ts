import { Environment, Project, User } from '@prisma/client'

export interface HydratedEnvironment extends Environment {
  lastUpdatedBy: {
    id: User['id']
    name: User['name']
    profilePictureUrl: User['profilePictureUrl']
  }
  project: {
    id: Project['id']
    name: Project['name']
    slug: Project['slug']
    workspaceId: Project['workspaceId']
  }
  entitlements: {
    canUpdate: boolean
    canDelete: boolean
  }
}

export interface RawEnvironment
  extends Omit<HydratedEnvironment, 'entitlements'> {}
