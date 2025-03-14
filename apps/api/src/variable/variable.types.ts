import {
  Environment,
  Project,
  User,
  Variable,
  VariableVersion
} from '@prisma/client'

export interface VariableWithValue extends Variable {
  value: string
}

export interface VariableWithVersion extends Variable {
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

export interface VariableWithProject extends Variable {
  project: Project
}

export type VariableWithProjectAndVersion = VariableWithProject &
  VariableWithVersion

export interface VariableWithValues {
  variable: Variable & { lastUpdatedBy: { id: string; name: string } }
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
