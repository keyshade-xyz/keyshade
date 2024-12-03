import { CreateApiKeySchema } from '@/api-key'

describe('API Key Schema Tests', () => {
  it('should validate if proper input is specified', () => {
    const result = CreateApiKeySchema.safeParse({
      name: 'test'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if invalid values are specified', () => {
    const result = CreateApiKeySchema.safeParse({
      name: 123,
      expiresAfter: 123
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(2)
  })

  it('should not validate if required values are not specified', () => {
    const result = CreateApiKeySchema.safeParse({})

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })
})
