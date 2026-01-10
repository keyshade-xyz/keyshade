import { Environment, Project, Secret, User, Variable } from '@prisma/client'

export interface HydratedProject extends Project {
  maxAllowedEnvironments: number
  totalEnvironments: number
  maxAllowedSecrets: number
  totalSecrets: number
  maxAllowedVariables: number
  totalVariables: number
  environments: number
  secrets: number
  variables: number
  entitlements: {
    canReadSecrets: boolean
    canCreateSecrets: boolean
    canReadVariables: boolean
    canCreateVariables: boolean
    canReadEnvironments: boolean
    canCreateEnvironments: boolean
    canUpdate: boolean
    canDelete: boolean
  }
  lastUpdatedBy: {
    id: User['id']
    name: User['name']
    profilePictureUrl: User['profilePictureUrl']
  }
}

export interface RawProject
  extends Omit<
    HydratedProject,
    | 'entitlements'
    | 'maxAllowedEnvironments'
    | 'totalEnvironments'
    | 'maxAllowedSecrets'
    | 'totalSecrets'
    | 'maxAllowedVariables'
    | 'totalVariables'
    | 'environments'
    | 'secrets'
    | 'variables'
  > {
  secrets: Partial<Secret>[]
  variables: Partial<Variable>[]
  environments: Partial<Environment>[]
}

export { ExportFormat, ExportData } from './export/export.types'
