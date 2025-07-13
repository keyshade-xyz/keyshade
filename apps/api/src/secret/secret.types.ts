import {
  Environment,
  Project,
  Secret,
  SecretVersion,
  User
} from '@prisma/client'

export interface SecretWithVersion extends Secret {
  versions: {
    environment: {
      id: Environment['id']
      name: Environment['name']
      slug: Environment['slug']
    }
    value: SecretVersion['value']
    version: SecretVersion['version']
    createdOn: SecretVersion['createdOn']
    createdBy: {
      id: User['id']
      name: User['name']
      profilePictureUrl: User['profilePictureUrl']
    }
  }[]
}

export interface SecretWithProject extends Secret {
  project: Project
}

export interface SecretWithEntitlements extends Secret {
  entitlements: {
    canUpdate: boolean
    canDelete: boolean
  }
}

export type HydratedSecret = SecretWithProject &
  SecretWithVersion &
  SecretWithEntitlements

export interface SecretWithValues {
  secret: Secret & { lastUpdatedBy: { id: string; name: string } }
  values: Array<{
    environment: {
      id: string
      name: string
      slug: string
    }
    value: string
    version: number
  }>
}
