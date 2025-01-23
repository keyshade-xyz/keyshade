import { generateSecretValue } from './secret'

describe('generateSecretValue', () => {
  test('should generate a string of exactly 20 characters', () => {
    const secret = generateSecretValue()
    expect(secret).toHaveLength(20)
  })

  test('should include at least one digit', () => {
    const secret = generateSecretValue()
    expect(secret).toMatch(/\d/)
  })

  test('should include at least one lowercase letter', () => {
    const secret = generateSecretValue()
    expect(secret).toMatch(/[a-z]/)
  })

  test('should include at least one uppercase letter', () => {
    const secret = generateSecretValue()
    expect(secret).toMatch(/[A-Z]/)
  })

  test('should include at least one special character', () => {
    const secret = generateSecretValue()
    expect(secret).toMatch(/[!@#$%^&*]/)
  })

  test('should only include allowed characters', () => {
    const secret = generateSecretValue()
    expect(secret).toMatch(/^[0-9a-zA-Z!@#$%^&*]{20}$/)
  })

  test('should generate different values for consecutive calls', () => {
    const secret1 = generateSecretValue()
    const secret2 = generateSecretValue()
    expect(secret1).not.toBe(secret2)
  })
})
