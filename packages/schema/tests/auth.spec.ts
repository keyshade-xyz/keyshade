import {
  ResendOTPRequestSchema,
  ResendOTPResponseSchema
} from '../src/auth/auth'

describe('Auth Schema Tests', () => {
  // Tests for ResendOTPRequestSchema
  it('should validate a valid ResendOTPRequestSchema', () => {
    const result = ResendOTPRequestSchema.safeParse({
      userEmail: 'test@example.com'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid ResendOTPRequestSchema with missing userEmail', () => {
    const result = ResendOTPRequestSchema.safeParse({})

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['userEmail'])
  })

  // Tests for ResendOTPResponseSchema
  it('should validate an empty response for ResendOTPResponseSchema', () => {
    const result = ResendOTPResponseSchema.safeParse(undefined)

    expect(result.success).toBe(true)
  })

  it('should not validate when unexpected fields are provided for ResendOTPResponseSchema', () => {
    const result = ResendOTPResponseSchema.safeParse({
      unexpectedField: 'value'
    })

    expect(result.success).toBe(false)
  })
})
