import {
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
  // Tests for GetSelfResponseSchema
  it('should validate a valid GetSelfResponseSchema', () => {
    const result = GetSelfResponseSchema.safeParse({
      id: 'user123',
      email: 'user@example.com',
      name: 'John Doe',
      profilePictureUrl: null,
      isActive: true,
      isOnboardingFinished: false,
      isAdmin: false,
      authProvider: 'email',
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

  // Tests for UpdateSelfRequestSchema
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

  // Tests for UpdateSelfResponseSchema
  it('should validate a valid UpdateSelfResponseSchema', () => {
    const result = UpdateSelfResponseSchema.safeParse({
      id: 'user123',
      email: 'jane@example.com',
      name: 'Jane Doe',
      isActive: true
    })
    expect(result.success).toBe(true)
  })

  it('should fail validation for invalid UpdateSelfResponseSchema', () => {
    const result = UpdateSelfResponseSchema.safeParse({
      id: 123, // Should be a string
      email: 'jane@example.com'
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues.length).toBe(1)
  })

  // Tests for DeleteSelfRequestSchema
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

  // Tests for DeleteSelfResponseSchema
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

  // Tests for ValidateEmailChangeOTPRequestSchema
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

  // Tests for ValidateEmailChangeOTPResponseSchema
  it('should validate a valid ValidateEmailChangeOTPResponseSchema', () => {
    const result = ValidateEmailChangeOTPResponseSchema.safeParse({
      id: 'user123',
      email: 'user@example.com',
      name: 'John Doe',
      profilePictureUrl: null,
      isActive: true,
      isOnboardingFinished: false,
      isAdmin: false,
      authProvider: 'email'
    })
    expect(result.success).toBe(true)
  })

  it('should fail validation for invalid ValidateEmailChangeOTPResponseSchema', () => {
    const result = ValidateEmailChangeOTPResponseSchema.safeParse(undefined)
    expect(result.success).toBe(false)
    expect(result.error?.issues.length).toBe(1)
  })

  // Tests for ResendEmailChangeOTPRequestSchema
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

  // Tests for ResendEmailChangeOTPResponseSchema
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
