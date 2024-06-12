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
