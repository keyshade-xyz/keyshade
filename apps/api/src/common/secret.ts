import { SecretWithValues } from '@/secret/secret.types'
import { decrypt } from './cryptography'

export async function getSecretWithValues(
  secretWithVersion: SecretWithValues['secret'] & {
    versions: SecretWithValues['values']
  },
  shouldBePlaintext?: boolean,
  privateKey?: string
): Promise<SecretWithValues> {
  const values = secretWithVersion.versions

  if (shouldBePlaintext && privateKey) {
    await Promise.all(
      values.map(async (value) => {
        value.value = await decrypt(privateKey, value.value)
      })
    )
  }

  delete secretWithVersion.versions
  const secret = secretWithVersion
  return {
    secret,
    values
  }
}

export function generateSecretValue(): string {
  const length = 20
  const digits = '0123456789'
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz'
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const specialChars = '!@#$%^&*'
  const allChars = digits + lowercaseChars + uppercaseChars + specialChars

  const getRandomIndex = (max: number): number => {
    const randomValues = new Uint8Array(1)
    crypto.getRandomValues(randomValues)
    return randomValues[0] % max
  }

  // Ensure at least one character from each required set is included
  const result = [
    lowercaseChars[getRandomIndex(lowercaseChars.length)],
    uppercaseChars[getRandomIndex(uppercaseChars.length)],
    digits[getRandomIndex(digits.length)],
    specialChars[getRandomIndex(specialChars.length)]
  ]

  // Fill the rest of the string to meet the minimum length
  while (result.length < length) {
    result.push(allChars[getRandomIndex(allChars.length)])
  }

  // Shuffle the result to randomize the order
  for (let i = result.length - 1; i > 0; i--) {
    const j = getRandomIndex(i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result.join('')
}
