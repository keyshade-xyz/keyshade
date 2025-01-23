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

export const digits = '0123456789'
export const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz'
export const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const specialChars = '!@#$%^&*'
export const allChars = digits + lowercaseChars + uppercaseChars + specialChars

export function generateSecretValue(): string {
  const length = 20

  // Ensure at least one character from each required set is included
  const result = [
    lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)],
    uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)],
    digits[Math.floor(Math.random() * digits.length)],
    specialChars[Math.floor(Math.random() * specialChars.length)]
  ]

  // Fill the rest of the string to meet the minimum length
  while (result.length < length) {
    result.push(allChars[Math.floor(Math.random() * allChars.length)])
  }

  // Shuffle the result to randomize the order
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result.join('')
}
