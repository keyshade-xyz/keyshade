import { Secret } from '@prisma/client'

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

export function getSecretWithValues(
  secretWithVersion: SecretWithValues['secret'] & {
    versions: SecretWithValues['values']
  }
): SecretWithValues {
  const { versions, ...secret } = secretWithVersion
  return {
    secret,
    values: versions
  }
}
