import { Project, Variable, VariableVersion } from '@prisma/client'

export interface VariableWithValue extends Variable {
  value: string
}

export interface VariableWithVersion extends Variable {
  versions: VariableVersion[]
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
