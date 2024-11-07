import { CreateEnvironmentSchema } from '@/environment'

describe('Environment Schema Tests', () => {
  it('should validate if proper input is specified', () => {
    const result = CreateEnvironmentSchema.safeParse({
      name: 'test'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if invalid values are specified', () => {
    const result = CreateEnvironmentSchema.safeParse({
      name: 123
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  it('should not validate if required values are not specified', () => {
    const result = CreateEnvironmentSchema.safeParse({})

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })
})
