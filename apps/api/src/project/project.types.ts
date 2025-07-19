import { Environment, Project, Secret, User, Variable } from '@prisma/client'

export interface HydratedProject extends Project {
  secretCount: number
  variableCount: number
  environmentCount: number
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
  maxAllowedEnvironments: number
  totalEnvironments: number
  maxAllowedSecrets: number
  totalSecrets: number
  maxAllowedVariables: number
  totalVariables: number
}

export interface RawProject
  extends Omit<
    HydratedProject,
    | 'entitlements'
    | 'secretCount'
    | 'variableCount'
    | 'environmentCount'
    | 'maxAllowedEnvironments'
    | 'totalEnvironments'
    | 'maxAllowedSecrets'
    | 'totalSecrets'
    | 'maxAllowedVariables'
    | 'totalVariables'
  > {
  secrets: Secret[]
  variables: Variable[]
  environments: Environment[]
}

export { ExportFormat, ExportData } from './export/export.types'
