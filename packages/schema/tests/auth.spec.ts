import { ResendOTPRequestSchema, ResendOTPResponseSchema } from '../src/auth'

describe('Auth Schema Tests', () => {
  describe('ResendOTPRequestSchema Tests', () => {
    it('should validate a valid ResendOTPRequestSchema', () => {
      const result = ResendOTPRequestSchema.safeParse({
        userEmail: 'test@example.com'
      })

      expect(result.success).toBe(true)
    })

    it('should not validate an invalid ResendOTPRequestSchema with a non email string', () => {
      const result = ResendOTPRequestSchema.safeParse({
        userEmail: 'invalid-email'
      })

      expect(result.success).toBe(false)
      expect(result.error?.issues[0]?.path).toEqual(['userEmail'])
    })

    it('should not validate an invalid ResendOTPRequestSchema with userEmail of different type', () => {
      const result = ResendOTPRequestSchema.safeParse({
        userEmail: 456
      })

      expect(result.success).toBe(false)
      expect(result.error?.issues[0]?.path).toEqual(['userEmail'])
    })

    it('should not validate an invalid ResendOTPRequestSchema with missing userEmail', () => {
      const result = ResendOTPRequestSchema.safeParse({})

      expect(result.success).toBe(false)
      expect(result.error?.issues[0]?.path).toEqual(['userEmail'])
    })
  })

  describe('ResendOTPResponseSchema Tests', () => {
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
})
