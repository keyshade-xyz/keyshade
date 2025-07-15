import {
  Environment,
  Project,
  Secret,
  SecretVersion,
  User
} from '@prisma/client'

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
  project: Project
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

export interface SecretWithValues {
  secret: HydratedSecret
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
