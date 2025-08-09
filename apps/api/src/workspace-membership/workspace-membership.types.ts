import { User, WorkspaceMember, WorkspaceRole } from '@prisma/client'

export interface HydratedWorkspaceMember extends WorkspaceMember {
  roles: {
    role: WorkspaceRole
  }[]
  user: {
    id: User['id']
    name: User['name']
    profilePictureUrl: User['profilePictureUrl']
  }
  entitlements: {
    canUpdateRoles: boolean
    canTransferOwnershipTo: boolean
    canRemove: boolean
    canCancelInvitation: boolean
    canResendInvitation: boolean
  }
}

export interface RawWorkspaceMember
  extends Omit<HydratedWorkspaceMember, 'entitlements'> {}
