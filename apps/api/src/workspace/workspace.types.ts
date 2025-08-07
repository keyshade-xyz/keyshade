import {
  Integration,
  Project,
  Subscription,
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
  maxAllowedRoles: number
  totalRoles: number
  maxAllowedIntegrations: number
  totalIntegrations: number
  projects: number
  integrations: number
  subscription: Subscription
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
    | 'maxAllowedRoles'
    | 'totalRoles'
    | 'maxAllowedIntegrations'
    | 'totalIntegrations'
    | 'projects'
    | 'integrations'
  > {
  subscription: Subscription
  members: Partial<WorkspaceMember>[]
  roles: Partial<WorkspaceRole>[]
  projects: Partial<Project>[]
  integrations: Partial<Integration>[]
}
