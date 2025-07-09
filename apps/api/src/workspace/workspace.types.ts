import { Subscription, User, Workspace, WorkspaceMember } from '@prisma/client'

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

export interface WorkspaceWithLastUpdatedByAndOwnerAndSubscription
  extends WorkspaceWithLastUpdatedByAndOwner {
  subscription: Subscription
}

export interface WorkspaceWithLastUpdatedByAndOwnerAndProjects
  extends WorkspaceWithLastUpdatedByAndOwnerAndSubscription {
  projects: number
}
