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
  const values = secretWithVersion.versions
  delete secretWithVersion.versions
  const secret = secretWithVersion
  return {
    secret,
    values
  }
}
