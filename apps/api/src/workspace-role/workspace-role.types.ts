import {
  Environment,
  Project,
  User,
  Workspace,
  WorkspaceRole
} from '@prisma/client'

export interface HydratedWorkspaceRole extends WorkspaceRole {
  projects: {
    project: {
      id: Project['id']
      name: Project['name']
      slug: Project['slug']
      workspaceId: Project['workspaceId']
    }
    environments: {
      id: Environment['id']
      name: Environment['name']
      slug: Environment['slug']
    }[]
  }[]
  entitlements: {
    canUpdate: boolean
    canDelete: boolean
  }
  workspace: Workspace
}

export interface RawWorkspaceRole
  extends Omit<HydratedWorkspaceRole, 'entitlements'> {
  members?: Array<{
    id: User['id']
    name: User['name']
    email: User['email']
    profilePictureUrl: User['profilePictureUrl']
    memberSince: Date
  }>
}
