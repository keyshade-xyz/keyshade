import { Project, Secret, SecretVersion } from '@prisma/client'

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

export interface SecretWithValues {
  secret: Secret & { lastUpdatedBy: { id: string; name: string } }
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
