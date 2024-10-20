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

export type SecretWithProjectAndVersion = SecretWithProject & SecretWithVersion
