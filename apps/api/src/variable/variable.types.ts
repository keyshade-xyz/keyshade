import {
  Environment,
  Project,
  User,
  Variable,
  VariableVersion
} from '@prisma/client'

export interface HydratedVariable extends Variable {
  lastUpdatedBy: {
    id: string
    name: string
    profilePictureUrl: string
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
    value: VariableVersion['value']
    version: VariableVersion['version']
    createdOn: VariableVersion['createdOn']
    createdBy: {
      id: User['id']
      name: User['name']
      profilePictureUrl: User['profilePictureUrl']
    }
  }[]
}

export interface VariableWithValues {
  variable: HydratedVariable
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
