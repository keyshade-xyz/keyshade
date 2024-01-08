import { Secret, SecretVersion } from '@prisma/client'

export interface SecretWithValue extends Secret {
  value: string
}

export interface SecretWithVersion extends Secret {
  versions: SecretVersion[]
}
