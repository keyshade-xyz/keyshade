import { User, Workspace, WorkspaceMember } from '@prisma/client'

export interface WorkspaceWithLastUpdateBy extends Workspace {
  lastUpdatedBy: {
    id: User['id']
    name: User['name']
    profilePictureUrl: User['profilePictureUrl']
  }
}

export interface WorkspaceWithLastUpdatedByAndOwner
  extends WorkspaceWithLastUpdateBy {
  ownedBy: {
    id: User['id']
    name: User['name']
    profilePictureUrl: User['profilePictureUrl']
    ownedSince: WorkspaceMember['createdOn']
  }
}
