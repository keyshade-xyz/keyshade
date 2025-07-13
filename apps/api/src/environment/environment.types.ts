import { Environment, Project } from '@prisma/client'

export interface EnvironmentWithProject extends Environment {
  project: Project
}

export interface EnvironmentWithLastUpdatedBy extends Environment {
  lastUpdatedBy: {
    id: string
    name: string
    profilePictureUrl: string | null
  }
}

export interface EnvironmentWithEntitlements extends Environment {
  entitlements: {
    canUpdate: boolean
    canDelete: boolean
  }
}

export interface HydratedEnvironment
  extends EnvironmentWithProject,
    EnvironmentWithEntitlements,
    EnvironmentWithLastUpdatedBy {}
