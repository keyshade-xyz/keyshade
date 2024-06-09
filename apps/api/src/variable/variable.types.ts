import { Environment, Project, Variable, VariableVersion } from '@prisma/client'

export interface VariableWithValue extends Variable {
  value: string
}

export interface VariableWithVersion extends Variable {
  versions: VariableVersion[]
}

export interface VariableWithProject extends Variable {
  project: Project
}

export interface VariableWithEnvironment extends Variable {
  environment: Environment
}

export type VariablesByEnvironment = {
  environment: { id: string; name: string }
  variables: any[]
}

export type VariableWithProjectAndVersion = VariableWithProject &
  VariableWithVersion
