import { Environment, Project, Secret, SecretVersion } from '@prisma/client'

export interface SecretWithValue extends Secret {
  value: string
}

export interface SecretWithVersion extends Secret {
  versions: SecretVersion[]
}

export interface SecretWithProject extends Secret {
  project: Project
}

export interface SecretWithEnvironment extends Secret {
  environment: Environment
}

export type SecretsByEnvironment = {
  environment: { id: string; name: string }
  secrets: any[]
}
export type SecretWithProjectAndVersion = SecretWithProject & SecretWithVersion
export type SecretWithVersionAndEnvironment = SecretWithVersion &
  SecretWithEnvironment
