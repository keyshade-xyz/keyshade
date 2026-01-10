import {
  Environment,
  Project,
  Secret,
  SecretVersion,
  User
} from '@prisma/client'

export interface HydratedSecretRevision {
  environment: {
    id: Environment['id']
    name: Environment['name']
    slug: Environment['slug']
    maxAllowedRevisions: number
    totalRevisions: number
  }
  value: SecretVersion['value']
  version: SecretVersion['version']
  createdOn: SecretVersion['createdOn']
  createdBy: {
    id: User['id']
    name: User['name']
    profilePictureUrl: User['profilePictureUrl']
  }
}

export interface RawSecretRevision
  extends Omit<HydratedSecretRevision, 'environment'> {
  environment: {
    id: Environment['id']
    name: Environment['name']
    slug: Environment['slug']
  }
}

export interface HydratedSecret extends Secret {
  lastUpdatedBy: {
    id: User['id']
    name: User['name']
    profilePictureUrl: User['profilePictureUrl']
  }
  entitlements: {
    canUpdate: boolean
    canDelete: boolean
  }
  // Deleted before returning
  project: {
    id: Project['id']
    name: Project['name']
    slug: Project['slug']
    workspaceId: Project['workspaceId']
    publicKey: Project['publicKey']
    privateKey: Project['privateKey']
    storePrivateKey: Project['storePrivateKey']
  }
  versions: Array<HydratedSecretRevision>
}

export interface RawSecret
  extends Omit<HydratedSecret, 'entitlements' | 'versions'> {
  versions: Array<RawSecretRevision>
}
