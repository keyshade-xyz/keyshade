import {
  UserSchema,
  GetSelfResponseSchema,
  UpdateSelfRequestSchema,
  UpdateSelfResponseSchema,
  DeleteSelfRequestSchema,
  DeleteSelfResponseSchema,
  ValidateEmailChangeOTPRequestSchema,
  ValidateEmailChangeOTPResponseSchema,
  ResendEmailChangeOTPRequestSchema,
  ResendEmailChangeOTPResponseSchema
} from '@/user'

describe('User Schema Tests', () => {
  describe('UserSchema Tests', () => {
    it('should validate a valid UserSchema', () => {
      const result = UserSchema.safeParse({
        id: 'user123',
        email: 'user@example.com',
        name: 'User Name',
        profilePictureUrl: 'http://example.com/profile.jpg',
        isActive: true,
        isOnboardingFinished: true,
        isAdmin: false,
        authProvider: 'GOOGLE'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid UserSchema', () => {
      const result = UserSchema.safeParse({
        id: 'user123',
        email: 'user@example', // Invalid email
        name: 'User Name',
        profilePictureUrl: 'http://example.com/profile.jpg',
        isActive: true,
        isOnboardingFinished: true,
        isAdmin: false,
        authProvider: 'GOOGLE'
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })

    it('should not validate an invalid UserSchema with missing fields', () => {
      const result = UserSchema.safeParse({
        id: 'user123',
        email: 'user@example.com',
        name: 'User Name',
        isActive: true,
        isOnboardingFinished: true,
        isAdmin: false,
        authProvider: 'GOOGLE'
        // Missing profilePictureUrl
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })

    it('should not validate an invalid UserSchema with incorrect types', () => {
      const result = UserSchema.safeParse({
        id: 'user123',
        email: 'user@example.com',
        name: 'User Name',
        profilePictureUrl: 'http://example.com/profile.jpg',
        isActive: 'true', // Should be a boolean
        isOnboardingFinished: true,
        isAdmin: false,
        authProvider: 'GOOGLE'
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1) // Adjust the number based on incorrect types
    })
  })

  describe('GetSelfResponseSchema Tests', () => {
    it('should validate a valid GetSelfResponseSchema', () => {
      const result = GetSelfResponseSchema.safeParse({
        id: 'user123',
        email: 'user@example.com',
        name: 'John Doe',
        profilePictureUrl: null,
        isActive: true,
        isOnboardingFinished: false,
        isAdmin: false,
        authProvider: 'EMAIL_OTP',
        defaultWorkspace: {
          id: 'workspace123',
          name: 'My Workspace',
          slug: 'my-workspace',
          icon: 'icon.png',
          isFreeTier: true,
          createdAt: '2024-10-01T00:00:00Z',
          updatedAt: '2024-10-01T00:00:00Z',
          ownerId: 'owner123',
          isDefault: true,
          lastUpdatedById: 'user123'
        }
      })
      expect(result.success).toBe(true)
    })

    it('should fail validation for invalid GetSelfResponseSchema', () => {
      const result = GetSelfResponseSchema.safeParse({
        email: 'invalid-email',
        name: 'John Doe'
        // Missing required fields and invalid email
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues.length).toBe(8)
    })
  })

  describe('UpdateSelfRequestSchema Tests', () => {
    it('should validate a valid UpdateSelfRequestSchema', () => {
      const result = UpdateSelfRequestSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        isOnboardingFinished: true
      })
      expect(result.success).toBe(true)
    })

    it('should fail validation for invalid UpdateSelfRequestSchema', () => {
      const result = UpdateSelfRequestSchema.safeParse({
        email: 'invalid-email-format'
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues.length).toBe(1)
    })
  })

  describe('UpdateSelfResponseSchema Tests', () => {
    it('should validate a valid UpdateSelfResponseSchema', () => {
      const result = UpdateSelfResponseSchema.safeParse({
        id: 'user123',
        email: 'jane@example.com',
        name: 'Jane Doe',
        isActive: true,
        profilePictureUrl: null,
        isOnboardingFinished: false,
        isAdmin: false,
        authProvider: 'EMAIL_OTP'
      })
      expect(result.success).toBe(true)
    })

    it('should fail validation for invalid UpdateSelfResponseSchema', () => {
      const result = UpdateSelfResponseSchema.safeParse({
        id: 123, // Should be a string
        email: 'jane@example.com'
        // Missing required fields
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues.length).toBe(7)
    })
  })

  describe('DeleteSelfRequestSchema Tests', () => {
    it('should validate a valid DeleteSelfRequestSchema', () => {
      const result = DeleteSelfRequestSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should fail validation for invalid DeleteSelfRequestSchema', () => {
      const result = DeleteSelfRequestSchema.safeParse({
        unexpectedField: 'value'
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues.length).toBe(1)
    })
  })

  describe('DeleteSelfResponseSchema Tests', () => {
    it('should validate a valid DeleteSelfResponseSchema', () => {
      const result = DeleteSelfResponseSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should fail validation for invalid DeleteSelfResponseSchema', () => {
      const result = DeleteSelfResponseSchema.safeParse({
        success: true
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues.length).toBe(1)
    })
  })

  describe('ValidateEmailChangeOTPRequestSchema Tests', () => {
    it('should validate a valid ValidateEmailChangeOTPRequestSchema', () => {
      const result = ValidateEmailChangeOTPRequestSchema.safeParse({
        otp: '123456'
      })
      expect(result.success).toBe(true)
    })

    it('should fail validation for OTP of length other than 6 ValidateEmailChangeOTPRequestSchema', () => {
      const result = ValidateEmailChangeOTPRequestSchema.safeParse({
        otp: '234' // Should be a 6 digit string
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues.length).toBe(1)
    })

    it('should fail validation for invalid ValidateEmailChangeOTPRequestSchema', () => {
      const result = ValidateEmailChangeOTPRequestSchema.safeParse({
        otp: 123456 // Should be a string
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues.length).toBe(1)
    })
  })

  describe('ValidateEmailChangeOTPResponseSchema Tests', () => {
    it('should validate a valid ValidateEmailChangeOTPResponseSchema', () => {
      const result = ValidateEmailChangeOTPResponseSchema.safeParse({
        id: 'user123',
        email: 'user@example.com',
        name: 'John Doe',
        profilePictureUrl: null,
        isActive: true,
        isOnboardingFinished: false,
        isAdmin: false,
        authProvider: 'EMAIL_OTP'
      })
      expect(result.success).toBe(true)
    })

    it('should fail validation for invalid ValidateEmailChangeOTPResponseSchema', () => {
      const result = ValidateEmailChangeOTPResponseSchema.safeParse(undefined)
      expect(result.success).toBe(false)
      expect(result.error?.issues.length).toBe(1)
    })
  })

  describe('ResendEmailChangeOTPRequestSchema Tests', () => {
    it('should validate a valid ResendEmailChangeOTPRequestSchema', () => {
      const result = ResendEmailChangeOTPRequestSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should fail validation for invalid ResendEmailChangeOTPRequestSchema', () => {
      const result = ResendEmailChangeOTPRequestSchema.safeParse({
        extraField: 'value' // Should not have any fields
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues.length).toBe(1)
    })
  })

  describe('ResendEmailChangeOTPResponseSchema Tests', () => {
    it('should validate a valid ResendEmailChangeOTPResponseSchema', () => {
      const result = ResendEmailChangeOTPResponseSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should fail validation for invalid ResendEmailChangeOTPResponseSchema', () => {
      const result = ResendEmailChangeOTPResponseSchema.safeParse({
        success: true
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues.length).toBe(1)
    })
  })
})
