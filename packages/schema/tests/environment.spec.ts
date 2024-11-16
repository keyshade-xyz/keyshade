import {
  EnvironmentSchema,
  CreateEnvironmentRequestSchema,
  CreateEnvironmentResponseSchema,
  UpdateEnvironmentRequestSchema,
  UpdateEnvironmentResponseSchema,
  GetEnvironmentRequestSchema,
  GetEnvironmentResponseSchema,
  GetAllEnvironmentsOfProjectRequestSchema,
  GetAllEnvironmentsOfProjectResponseSchema,
  DeleteEnvironmentRequestSchema,
  DeleteEnvironmentResponseSchema
} from '@/environment/environment'

describe('Environment Schema Tests', () => {
  // Tests for EnvironmentSchema
  it('should validate a valid EnvironmentSchema', () => {
    const result = EnvironmentSchema.safeParse({
      id: 'env123',
      name: 'Development',
      slug: 'development',
      description: null,
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      lastUpdatedById: 'user123',
      projectId: 'project123'
    })
    expect(result.success).toBe(true)
  })

  it('should not validate an invalid EnvironmentSchema with missing fields', () => {
    const result = EnvironmentSchema.safeParse({
      id: 'env123',
      name: 'Development'
      // Missing required fields
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(6)
  })

  it('should not validate an invalid EnvironmentSchema with incorrect types', () => {
    const result = EnvironmentSchema.safeParse({
      id: 'env123',
      name: 'Development',
      slug: 'development',
      description: 'Development environment',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      lastUpdatedById: 'user123',
      projectId: 123 // Should be a string
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  // Tests for CreateEnvironmentRequestSchema
  it('should validate if proper input is specified for CreateEnvironmentRequestSchema', () => {
    const result = CreateEnvironmentRequestSchema.safeParse({
      name: 'test',
      description: 'test description',
      projectId: 'project123'
    })
    expect(result.success).toBe(true)
  })

  it('should not validate if invalid values are specified for CreateEnvironmentRequestSchema', () => {
    const result = CreateEnvironmentRequestSchema.safeParse({
      name: 123,
      projectId: 'project123'
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  it('should not validate if required values are not specified for CreateEnvironmentRequestSchema', () => {
    const result = CreateEnvironmentRequestSchema.safeParse({
      name: 'test'
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  // Tests for CreateEnvironmentResponseSchema
  it('should validate a valid CreateEnvironmentResponseSchema', () => {
    const result = CreateEnvironmentResponseSchema.safeParse({
      id: 'env123',
      name: 'Development',
      slug: 'development',
      description: 'Development environment',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      lastUpdatedById: 'user123',
      projectId: 'project123'
    })
    expect(result.success).toBe(true)
  })

  it('should not validate an invalid CreateEnvironmentResponseSchema with multiple incorrect types', () => {
    const result = CreateEnvironmentResponseSchema.safeParse({
      id: 123, // Should be a string
      name: 'Development',
      slug: 'development',
      description: 456, // Should be a string or null
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      lastUpdatedById: 'user123',
      projectId: true // Should be a string
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(3)
  })

  // Tests for UpdateEnvironmentRequestSchema
  it('should validate if proper input is specified for UpdateEnvironmentRequestSchema', () => {
    const result = UpdateEnvironmentRequestSchema.safeParse({
      name: 'updatedTest',
      slug: 'updated-slug'
    })
    expect(result.success).toBe(true)
  })

  it('should not validate if invalid values are specified for UpdateEnvironmentRequestSchema', () => {
    const result = UpdateEnvironmentRequestSchema.safeParse({
      name: 123,
      slug: 'updated-slug'
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  // Tests for UpdateEnvironmentResponseSchema
  it('should validate a valid UpdateEnvironmentResponseSchema', () => {
    const result = UpdateEnvironmentResponseSchema.safeParse({
      id: 'env123',
      name: 'Development',
      slug: 'development',
      description: 'Development environment',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      lastUpdatedById: 'user123',
      projectId: 'project123'
    })
    expect(result.success).toBe(true)
  })

  it('should not validate an invalid UpdateEnvironmentResponseSchema with multiple incorrect types', () => {
    const result = UpdateEnvironmentResponseSchema.safeParse({
      id: 123, // Should be a string
      name: 'Development',
      slug: 'development',
      description: 456, // Should be a string or null
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      lastUpdatedById: 'user123',
      projectId: true // Should be a string
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(3)
  })

  // Tests for GetEnvironmentRequestSchema
  it('should validate if proper input is specified for GetEnvironmentRequestSchema', () => {
    const result = GetEnvironmentRequestSchema.safeParse({
      slug: 'test-slug'
    })
    expect(result.success).toBe(true)
  })

  it('should not validate if invalid values are specified for GetEnvironmentRequestSchema', () => {
    const result = GetEnvironmentRequestSchema.safeParse({
      slug: 123
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  // Tests for GetEnvironmentResponseSchema
  it('should validate a valid GetEnvironmentResponseSchema', () => {
    const result = GetEnvironmentResponseSchema.safeParse({
      id: 'env123',
      name: 'Development',
      slug: 'development',
      description: 'Development environment',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      lastUpdatedById: 'user123',
      projectId: 'project123'
    })
    expect(result.success).toBe(true)
  })

  it('should not validate an invalid GetEnvironmentResponseSchema with multiple incorrect types', () => {
    const result = GetEnvironmentResponseSchema.safeParse({
      id: 123, // Should be a string
      name: 'Development',
      slug: 'development',
      description: 456, // Should be a string or null
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      lastUpdatedById: 'user123',
      projectId: true // Should be a string
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(3)
  })

  // Tests for GetAllEnvironmentsOfProjectRequestSchema
  it('should validate if proper input is specified for GetAllEnvironmentsOfProjectRequestSchema', () => {
    const result = GetAllEnvironmentsOfProjectRequestSchema.safeParse({
      projectSlug: 'project-slug',
      page: 1,
      limit: 10
    })
    expect(result.success).toBe(true)
  })

  it('should not validate if invalid values are specified for GetAllEnvironmentsOfProjectRequestSchema', () => {
    const result = GetAllEnvironmentsOfProjectRequestSchema.safeParse({
      projectSlug: 123,
      page: 'one',
      limit: 'ten'
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(3)
  })

  // Tests for GetAllEnvironmentsOfProjectResponseSchema
  it('should validate a valid GetAllEnvironmentsOfProjectResponseSchema', () => {
    const result = GetAllEnvironmentsOfProjectResponseSchema.safeParse({
      items: [
        {
          id: 'env123',
          name: 'Development',
          slug: 'development',
          description: 'Development environment',
          createdAt: '2024-10-01T00:00:00Z',
          updatedAt: '2024-10-01T00:00:00Z',
          lastUpdatedById: 'user123',
          projectId: 'project123',
          lastUpdatedBy: {
            id: 'user123',
            name: 'John Doe',
            email: 'john.doe@example.com',
            profilePictureUrl: 'http://example.com/profile.jpg'
          }
        }
      ],
      metadata: {
        page: 1,
        perPage: 10,
        pageCount: 1,
        totalCount: 1,
        links: {
          self: 'http://example.com/page/1',
          first: 'http://example.com/page/1',
          previous: null,
          next: null,
          last: 'http://example.com/page/1'
        }
      }
    })
    expect(result.success).toBe(true)
  })

  it('should not validate an invalid GetAllEnvironmentsOfProjectResponseSchema with incorrect types', () => {
    const result = GetAllEnvironmentsOfProjectResponseSchema.safeParse({
      items: [
        {
          id: 'env123',
          name: 'Development',
          slug: 'development',
          description: 'Development environment',
          createdAt: '2024-10-01T00:00:00Z',
          updatedAt: '2024-10-01T00:00:00Z',
          lastUpdatedById: 'user123',
          projectId: 'project123',
          lastUpdatedBy: {
            id: 'user123',
            name: 'John Doe',
            email: 'john.doe@example.com',
            profilePictureUrl: null
          }
        }
      ],
      metadata: {
        page: 'one', // Should be a number
        perPage: 10,
        pageCount: 1,
        totalCount: 1,
        links: {
          self: 'http://example.com/page/1',
          first: 'http://example.com/page/1',
          previous: null,
          next: null,
          last: 'http://example.com/page/1'
        }
      }
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  // Tests for DeleteEnvironmentRequestSchema
  it('should validate if proper input is specified for DeleteEnvironmentRequestSchema', () => {
    const result = DeleteEnvironmentRequestSchema.safeParse({
      slug: 'test-slug'
    })
    expect(result.success).toBe(true)
  })

  it('should not validate if invalid values are specified for DeleteEnvironmentRequestSchema', () => {
    const result = DeleteEnvironmentRequestSchema.safeParse({
      slug: 123
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  // Tests for DeleteEnvironmentResponseSchema
  it('should validate a valid DeleteEnvironmentResponseSchema', () => {
    const result = DeleteEnvironmentResponseSchema.safeParse(undefined)
    expect(result.success).toBe(true)
  })

  it('should not validate an invalid DeleteEnvironmentResponseSchema', () => {
    const result = DeleteEnvironmentResponseSchema.safeParse({
      unexpectedField: 'value'
    })
    expect(result.success).toBe(false)
  })
})
