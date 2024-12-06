import {
  ApiKeySchema,
  CreateApiKeyRequestSchema,
  CreateApiKeyResponseSchema,
  UpdateApiKeyRequestSchema,
  UpdateApiKeyResponseSchema,
  DeleteApiKeyRequestSchema,
  DeleteApiKeyResponseSchema,
  GetApiKeysOfUserRequestSchema,
  GetApiKeysOfUserResponseSchema,
  GetApiKeyRequestSchema,
  GetApiKeyResponseSchema,
  CanAccessLiveUpdatesApiKeyRequestSchema,
  CanAccessLiveUpdatesApiKeyResponseSchema
} from '@/api-key'

describe('API Key Schemas Tests', () => {
  describe('ApiKeySchema Tests', () => {
    it('should validate a valid ApiKeySchema', () => {
      const result = ApiKeySchema.safeParse({
        id: 'apikey123',
        name: 'API Key Name',
        slug: 'api-key-slug',
        value: 'api-key-value',
        expiresAt: '2024-10-10T10:00:00Z',
        createdAt: '2024-10-09T10:00:00Z',
        updatedAt: '2024-10-09T10:00:00Z',
        authorities: ['READ_SECRET', 'READ_VARIABLE'],
        userId: 'user123'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid ApiKeySchema', () => {
      const result = ApiKeySchema.safeParse({
        id: 'apikey123',
        name: 'API Key Name',
        slug: 'api-key-slug',
        value: 'api-key-value',
        expiresAt: 'invalid-date', // Should be a valid date string
        createdAt: '2024-10-09T10:00:00Z',
        updatedAt: '2024-10-09T10:00:00Z',
        authorities: ['INVALID_AUTHORITY'] // Invalid authority
        // no userId
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(3)
    })
  })

  describe('CreateApiKeyRequestSchema Tests', () => {
    it('should validate if proper input is specified for CreateApiKeyRequestSchema', () => {
      const result = CreateApiKeyRequestSchema.safeParse({
        name: 'test',
        expiresAfter: '720',
        authorities: ['UPDATE_PROJECT']
      })

      expect(result.success).toBe(true)
    })

    it('should validate if optional fields are specified for CreateApiKeyRequestSchema', () => {
      const result = CreateApiKeyRequestSchema.safeParse({
        name: 'test',
        expiresAfter: '720',
        authorities: ['UPDATE_PROJECT'],
        slug: 'test-slug'
      })

      expect(result.success).toBe(true)
    })

    it('should not validate if invalid values are specified for CreateApiKeyRequestSchema', () => {
      const result = CreateApiKeyRequestSchema.safeParse({
        name: 123,
        expiresAfter: 123
      })

      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })

    it('should not validate if required values are not specified for CreateApiKeyRequestSchema', () => {
      const result = CreateApiKeyRequestSchema.safeParse({})

      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('CreateApiKeyResponseSchema Tests', () => {
    it('should validate a valid CreateApiKeyResponseSchema', () => {
      const result = CreateApiKeyResponseSchema.safeParse({
        id: 'apikey123',
        name: 'API Key Name',
        slug: 'api-key-slug',
        value: 'api-key-value',
        expiresAt: '2024-10-10T10:00:00Z',
        createdAt: '2024-10-09T10:00:00Z',
        updatedAt: '2024-10-09T10:00:00Z',
        authorities: ['READ_SECRET', 'READ_VARIABLE'],
        userId: 'user123'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid CreateApiKeyResponseSchema', () => {
      const result = CreateApiKeyResponseSchema.safeParse({
        id: 'apikey123',
        name: 'API Key Name',
        slug: 'api-key-slug',
        value: 'api-key-value',
        expiresAt: 'invalid-date', // Should be a valid date string
        createdAt: '2024-10-09T10:00:00Z',
        updatedAt: '2024-10-09T10:00:00Z',
        authorities: ['INVALID_AUTHORITY'], // Invalid authority
        expiresAfter: 'INVALID_EXPIRES_AFTER' // Invalid expiresAfter
        // no userId
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(3)
    })
  })

  describe('UpdateApiKeyRequestSchema Tests', () => {
    it('should validate a valid UpdateApiKeyRequestSchema', () => {
      const result = UpdateApiKeyRequestSchema.safeParse({
        apiKeySlug: 'api-key-slug',
        name: 'Updated API Key Name',
        authorities: ['READ_SECRET', 'READ_VARIABLE'],
        expiresAfter: '24'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid UpdateApiKeyRequestSchema', () => {
      const result = UpdateApiKeyRequestSchema.safeParse({
        // apiKeySlug is missing
        name: 'Updated API Key Name',
        authorities: ['INVALID_AUTHORITY'], // Invalid authority
        expiresAfter: 'INVALID_EXPIRES_AFTER' // Invalid expiresAfter
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(3)
    })
  })

  describe('UpdateApiKeyResponseSchema Tests', () => {
    it('should validate a valid UpdateApiKeyResponseSchema', () => {
      const result = UpdateApiKeyResponseSchema.safeParse({
        id: 'apikey123',
        name: 'API Key Name',
        slug: 'api-key-slug',
        expiresAt: '2024-10-10T10:00:00Z',
        createdAt: '2024-10-09T10:00:00Z',
        updatedAt: '2024-10-09T10:00:00Z',
        authorities: ['READ_SECRET', 'READ_VARIABLE']
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid UpdateApiKeyResponseSchema', () => {
      const result = UpdateApiKeyResponseSchema.safeParse({
        id: 'apikey123',
        name: 'API Key Name',
        slug: 'api-key-slug',
        expiresAt: 'invalid-date', // Should be a valid date string
        createdAt: '2024-10-09T10:00:00Z',
        updatedAt: '2024-10-09T10:00:00Z',
        authorities: ['INVALID_AUTHORITY'] // Invalid authority
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('DeleteApiKeyRequestSchema Tests', () => {
    it('should validate a valid DeleteApiKeyRequestSchema', () => {
      const result = DeleteApiKeyRequestSchema.safeParse({
        apiKeySlug: 'api-key-slug'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid DeleteApiKeyRequestSchema', () => {
      const result = DeleteApiKeyRequestSchema.safeParse({
        apiKeySlug: 123 // Should be a string
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1) // Adjust the number based on invalid fields
    })
  })

  describe('DeleteApiKeyResponseSchema Tests', () => {
    it('should validate a valid DeleteApiKeyResponseSchema', () => {
      const result = DeleteApiKeyResponseSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid DeleteApiKeyResponseSchema', () => {
      const result = DeleteApiKeyResponseSchema.safeParse({
        unexpectedField: 'value'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('GetApiKeysOfUserRequestSchema Tests', () => {
    it('should validate a valid GetApiKeysOfUserRequestSchema', () => {
      const result = GetApiKeysOfUserRequestSchema.safeParse({
        page: 1,
        limit: 10
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid GetApiKeysOfUserRequestSchema', () => {
      const result = GetApiKeysOfUserRequestSchema.safeParse({
        page: 'one', // Should be a number
        limit: 10
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('GetApiKeysOfUserResponseSchema Tests', () => {
    it('should validate a valid GetApiKeysOfUserResponseSchema', () => {
      const result = GetApiKeysOfUserResponseSchema.safeParse({
        items: [
          {
            id: 'apikey123',
            name: 'API Key Name',
            slug: 'api-key-slug',
            expiresAt: '2024-10-10T10:00:00Z',
            createdAt: '2024-10-09T10:00:00Z',
            updatedAt: '2024-10-09T10:00:00Z',
            authorities: ['READ_SECRET', 'READ_VARIABLE']
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

    it('should not validate an invalid GetApiKeysOfUserResponseSchema', () => {
      const result = GetApiKeysOfUserResponseSchema.safeParse({
        items: [
          {
            id: 'apikey123',
            name: 'API Key Name',
            slug: 'api-key-slug',
            expiresAt: 'invalid-date', // Should be a valid date string
            createdAt: '2024-10-09T10:00:00Z',
            updatedAt: '2024-10-09T10:00:00Z',
            authorities: ['INVALID_AUTHORITY'] // Invalid authority
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
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('GetApiKeyRequestSchema Tests', () => {
    it('should validate a valid GetApiKeyRequestSchema', () => {
      const result = GetApiKeyRequestSchema.safeParse({
        apiKeySlug: 'api-key-slug'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid GetApiKeyRequestSchema', () => {
      const result = GetApiKeyRequestSchema.safeParse({
        apiKeySlug: 123 // Should be a string
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('GetApiKeyResponseSchema Tests', () => {
    it('should validate a valid GetApiKeyResponseSchema', () => {
      const result = GetApiKeyResponseSchema.safeParse({
        id: 'apikey123',
        name: 'API Key Name',
        slug: 'api-key-slug',
        expiresAt: '2024-10-10T10:00:00Z',
        createdAt: '2024-10-09T10:00:00Z',
        updatedAt: '2024-10-09T10:00:00Z',
        authorities: ['READ_SECRET', 'READ_VARIABLE']
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid GetApiKeyResponseSchema', () => {
      const result = GetApiKeyResponseSchema.safeParse({
        id: 'apikey123',
        name: 'API Key Name',
        slug: 'api-key-slug',
        expiresAt: 'invalid-date', // Should be a valid date string
        createdAt: '2024-10-09T10:00:00Z',
        updatedAt: '2024-10-09T10:00:00Z',
        authorities: ['INVALID_AUTHORITY'] // Invalid authority
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('CanAccessLiveUpdatesApiKeyRequestSchema Tests', () => {
    it('should validate a valid CanAccessLiveUpdatesApiKeyRequestSchema', () => {
      const result =
        CanAccessLiveUpdatesApiKeyRequestSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid CanAccessLiveUpdatesApiKeyRequestSchema', () => {
      const result = CanAccessLiveUpdatesApiKeyRequestSchema.safeParse({
        unexpectedField: 'value'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('CanAccessLiveUpdatesApiKeyResponseSchema Tests', () => {
    it('should validate a valid CanAccessLiveUpdatesApiKeyResponseSchema', () => {
      const result = CanAccessLiveUpdatesApiKeyResponseSchema.safeParse({
        canAccessLiveUpdates: true
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid CanAccessLiveUpdatesApiKeyResponseSchema', () => {
      const result = CanAccessLiveUpdatesApiKeyResponseSchema.safeParse({
        canAccessLiveUpdates: 'true' // Should be a boolean
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1) // Adjust the number based on invalid fields
    })
  })
})
