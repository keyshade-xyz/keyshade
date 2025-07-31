import {
  Integration,
  Project,
  User,
  Workspace,
  WorkspaceMember,
  WorkspaceRole
} from '@prisma/client'

export interface HydratedWorkspace extends Workspace {
  maxAllowedProjects: number
  totalProjects: number
  maxAllowedMembers: number
  totalMembers: number
  projects: number
  entitlements: {
    canReadProjects: boolean
    canCreateProjects: boolean
    canReadIntegrations: boolean
    canCreateIntegrations: boolean
    canReadMembers: boolean
    canInviteMembers: boolean
    canReadRoles: boolean
    canCreateRoles: boolean
    canUpdate: boolean
    canDelete: boolean
  }
  lastUpdatedBy: {
    id: User['id']
    name: User['name']
    profilePictureUrl: User['profilePictureUrl']
  }
  isDefault: boolean
}

export interface RawWorkspace
  extends Omit<
    HydratedWorkspace,
    | 'entitlements'
    | 'maxAllowedProjects'
    | 'totalProjects'
    | 'maxAllowedMembers'
    | 'totalMembers'
    | 'projects'
  > {
  members: Partial<WorkspaceMember>[]
  roles: Partial<WorkspaceRole>[]
  projects: Partial<Project>[]
  integrations: Partial<Integration>[]
}
