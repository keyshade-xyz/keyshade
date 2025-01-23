import {
  generateSecretValue,
  digits,
  lowercaseChars,
  uppercaseChars,
  specialChars,
  allChars
} from './secret'

describe('generateSecretValue', () => {
  test('should include at least one digit', () => {
    const secret = generateSecretValue()
    expect(secret.split('').some((char) => digits.includes(char))).toBe(true)
  })

  test('should generate a string of exactly 20 characters', () => {
    const secret = generateSecretValue()
    expect(secret).toHaveLength(20)
  })

  test('should include at least one lowercase letter', () => {
    const secret = generateSecretValue()
    expect(secret.split('').some((char) => lowercaseChars.includes(char))).toBe(
      true
    )
  })

  test('should include at least one uppercase letter', () => {
    const secret = generateSecretValue()
    expect(secret.split('').some((char) => uppercaseChars.includes(char))).toBe(
      true
    )
  })

  test('should include at least one special character', () => {
    const secret = generateSecretValue()
    expect(secret.split('').some((char) => specialChars.includes(char))).toBe(
      true
    )
  })

  test('should only include allowed characters', () => {
    const secret = generateSecretValue()
    expect(secret.split('').every((char) => allChars.includes(char))).toBe(true)
  })

  test('should generate different values for consecutive calls', () => {
    const secret1 = generateSecretValue()
    const secret2 = generateSecretValue()
    expect(secret1).not.toBe(secret2)
  })
})
