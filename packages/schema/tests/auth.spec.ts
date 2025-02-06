import {
  ResendOTPRequestSchema,
  ResendOTPResponseSchema,
  SendOTPRequestSchema,
  SendOTPResponseSchema,
  ValidateOTPRequestSchema,
  ValidateOTPResponseSchema
} from '../src/auth'

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

  describe('ValidateOTPRequestSchema Tests', () => {
    it('should validate a valid ValidateOTPRequestSchema', () => {
      const result = ValidateOTPRequestSchema.safeParse({
        email: 'test@example.com',
        otp: '123456'
      })

      expect(result.success).toBe(true)
    })

    it('should not validate an invalid ValidateOTPRequestSchema', () => {
      const result = ValidateOTPRequestSchema.safeParse({
        email: 'test@example.com',
        otp: '12345' // Missing a digit
      })

      expect(result.success).toBe(false)
      expect(result.error?.issues[0]?.path).toEqual(['otp'])
    })
  })

  describe('ValidateOTPResponseSchema Tests', () => {
    it('should validate an empty response for ValidateOTPResponseSchema', () => {
      const result = ValidateOTPResponseSchema.safeParse({
        id: 'user123',
        email: 'jane@example.com',
        name: 'Jane Doe',
        isActive: true,
        profilePictureUrl: null,
        isOnboardingFinished: false,
        isAdmin: false,
        authProvider: 'email'
      })

      expect(result.success).toBe(true)
    })

    it('should not validate when unexpected fields are provided for ValidateOTPResponseSchema', () => {
      const result = ValidateOTPResponseSchema.safeParse({
        unexpectedField: 'value'
      })

      expect(result.success).toBe(false)
    })
  })

  describe('SendOTPRequestSchema Tests', () => {
    it('should validate a valid SendOTPRequestSchema', () => {
      const result = SendOTPRequestSchema.safeParse({
        email: 'test@example.com'
      })

      expect(result.success).toBe(true)
    })

    it('should not validate an invalid SendOTPRequestSchema', () => {
      const result = SendOTPRequestSchema.safeParse({
        email: 'invalid-email'
      })

      expect(result.success).toBe(false)
    })
  })

  describe('SendOTPResponseSchema Tests', () => {
    it('should validate an empty response for SendOTPResponseSchema', () => {
      const result = SendOTPResponseSchema.safeParse(undefined)

      expect(result.success).toBe(true)
    })

    it('should not validate when unexpected fields are provided for SendOTPResponseSchema', () => {
      const result = SendOTPResponseSchema.safeParse({
        unexpectedField: 'value'
      })

      expect(result.success).toBe(false)
    })
  })
})
