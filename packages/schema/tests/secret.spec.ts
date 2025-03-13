import {
  SecretSchema,
  CreateSecretRequestSchema,
  CreateSecretResponseSchema,
  UpdateSecretRequestSchema,
  UpdateSecretResponseSchema,
  DeleteSecretRequestSchema,
  DeleteSecretResponseSchema,
  RollBackSecretRequestSchema,
  RollBackSecretResponseSchema,
  GetAllSecretsOfProjectRequestSchema,
  GetAllSecretsOfProjectResponseSchema,
  GetRevisionsOfSecretRequestSchema,
  GetRevisionsOfSecretResponseSchema
} from '@/secret'
import { rotateAfterEnum } from '@/enums'

describe('Secret Schema Tests', () => {
  describe('SecretSchema Tests', () => {
    it('should validate a valid SecretSchema', () => {
      const result = SecretSchema.safeParse({
        secret: {
          id: 'secret123',
          name: 'Secret Name',
          slug: 'secret-slug',
          createdAt: '2024-10-01T00:00:00Z',
          updatedAt: '2024-10-01T00:00:00Z',
          rotateAt: null,
          note: 'This is a note',
          lastUpdatedById: 'user123',
          projectId: 'project123',
          lastUpdatedBy: {
            id: 'user123',
            name: 'John Doe',
            profilePictureUrl: 'http://example.com/profile.jpg'
          }
        },
        values: [
          {
            value: 'secret-value',
            version: 1,
            environment: {
              id: 'env123',
              name: 'Development',
              slug: 'development'
            },
            createdOn: '2024-10-01T00:00:00Z',
            createdBy: {
              id: 'user123',
              name: 'John Doe',
              profilePictureUrl: 'http://example.com/profile.jpg'
            }
          }
        ]
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid SecretSchema', () => {
      const result = SecretSchema.safeParse({
        secret: {
          id: 'secret123',
          name: 'Secret Name',
          slug: 'secret-slug',
          createdAt: '2024-10-01T00:00:00Z',
          updatedAt: '2024-10-01T00:00:00Z',
          rotateAt: null,
          note: 'This is a note',
          lastUpdatedById: 'user123',
          projectId: 'project123',
          lastUpdatedBy: {
            id: 'user123',
            name: 'John Doe'
            // Missing profilePictureUrl
          }
        },
        values: [
          {
            value: 'secret-value',
            // Missing version
            environment: {
              id: 'env123'
              // Missing slug
              // Missing name
            }
            // Missing createdBy
            // Missing createdOn
          }
        ]
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(6)
    })
  })

  describe('CreateSecretRequestSchema Tests', () => {
    it('should validate a valid CreateSecretRequestSchema', () => {
      const result = CreateSecretRequestSchema.safeParse({
        projectSlug: 'project-slug',
        name: 'Secret Name',
        note: 'This is a note',
        rotateAfter: rotateAfterEnum.enum['24'],
        entries: [
          {
            value: 'secret-value',
            environmentSlug: 'development'
          }
        ]
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid CreateSecretRequestSchema', () => {
      const result = CreateSecretRequestSchema.safeParse({
        projectSlug: 'project-slug',
        name: 'Secret Name',
        note: 'This is a note',
        rotateAfter: '30', // Invalid rotateAfter value
        entries: [
          {
            value: 'secret-value',
            environmentSlug: 'development'
          }
        ]
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('CreateSecretResponseSchema Tests', () => {
    it('should validate a valid CreateSecretResponseSchema', () => {
      const result = CreateSecretResponseSchema.safeParse({
        secret: {
          id: 'secret123',
          name: 'Secret Name',
          slug: 'secret-slug',
          createdAt: '2024-10-01T00:00:00Z',
          updatedAt: '2024-10-01T00:00:00Z',
          rotateAt: null,
          note: 'This is a note',
          lastUpdatedById: 'user123',
          projectId: 'project123',
          lastUpdatedBy: {
            id: 'user123',
            name: 'John Doe',
            profilePictureUrl: 'http://example.com/profile.jpg'
          }
        },
        values: [
          {
            value: 'secret-value',
            version: 1,
            environment: {
              id: 'env123',
              name: 'Development',
              slug: 'development'
            },
            createdOn: '2024-10-01T00:00:00Z',
            createdBy: {
              id: 'user123',
              name: 'John Doe',
              profilePictureUrl: 'http://example.com/profile.jpg'
            }
          }
        ]
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid CreateSecretResponseSchema', () => {
      const result = CreateSecretResponseSchema.safeParse({
        secret: {
          id: 'secret123',
          name: 'Secret Name',
          slug: 'secret-slug',
          createdAt: '2024-10-01T00:00:00Z',
          updatedAt: '2024-10-01T00:00:00Z',
          rotateAt: null,
          note: 'This is a note',
          lastUpdatedById: 'user123',
          projectId: 'project123',
          lastUpdatedBy: {
            id: 'user123',
            name: 'John Doe'
            // Missing profilePictureUrl
          }
        },
        values: [
          {
            value: 'secret-value',
            // Missing version
            environment: {
              id: 'env123'
              // Missing slug
              // Missing name
            }
            // Missing createdBy
            // Missing createdOn
          }
        ]
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(6)
    })
  })

  describe('UpdateSecretRequestSchema Tests', () => {
    it('should validate a valid UpdateSecretRequestSchema', () => {
      const result = UpdateSecretRequestSchema.safeParse({
        secretSlug: 'secret-slug',
        name: 'Updated Secret Name',
        note: 'Updated note'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid UpdateSecretRequestSchema', () => {
      const result = UpdateSecretRequestSchema.safeParse({
        secretSlug: 123, // Should be a string
        name: 'Updated Secret Name',
        note: 'Updated note'
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('UpdateSecretResponseSchema Tests', () => {
    it('should validate a valid UpdateSecretResponseSchema', () => {
      const result = UpdateSecretResponseSchema.safeParse({
        secret: {
          id: 'secret123',
          name: 'Secret Name',
          slug: 'secret-slug',
          note: 'This is a note'
        },
        updatedVersions: [
          {
            id: 'version123',
            environment: {
              id: 'env123',
              slug: 'development',
              name: 'Development'
            },
            createdOn: '2024-10-01T00:00:00Z',
            createdBy: {
              id: 'user123',
              name: 'John Doe',
              profilePictureUrl: 'http://example.com/profile.jpg'
            },
            value: 'secret-value',
            version: 4
          }
        ]
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid UpdateSecretResponseSchema', () => {
      const result = UpdateSecretResponseSchema.safeParse({
        secret: {
          id: 'secret123',
          name: 'Secret Name',
          slug: 'secret-slug',
          note: 'This is a note'
        },
        updatedVersions: [
          {
            id: 'version123',
            environment: {
              id: 'env123'
              // Missing slug
              // Missing name
            },
            // Missing createdOn
            // Missing createdBy
            value: 'secret-value'
            // Missing version
          }
        ]
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(5)
    })
  })

  describe('DeleteSecretRequestSchema Tests', () => {
    it('should validate a valid DeleteSecretRequestSchema', () => {
      const result = DeleteSecretRequestSchema.safeParse({
        secretSlug: 'secret-slug'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid DeleteSecretRequestSchema', () => {
      const result = DeleteSecretRequestSchema.safeParse({
        secretSlug: 123 // Should be a string
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('DeleteSecretResponseSchema Tests', () => {
    it('should validate a valid DeleteSecretResponseSchema', () => {
      const result = DeleteSecretResponseSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid DeleteSecretResponseSchema', () => {
      const result = DeleteSecretResponseSchema.safeParse({
        unexpectedField: 'value'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('RollBackSecretRequestSchema Tests', () => {
    it('should validate a valid RollBackSecretRequestSchema', () => {
      const result = RollBackSecretRequestSchema.safeParse({
        environmentSlug: 'development',
        version: 1,
        secretSlug: 'secret-slug'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid RollBackSecretRequestSchema', () => {
      const result = RollBackSecretRequestSchema.safeParse({
        environmentSlug: 'development',
        version: 'one', // Should be a number
        secretSlug: 'secret-slug'
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('RollBackSecretResponseSchema Tests', () => {
    it('should validate a valid RollBackSecretResponseSchema', () => {
      const result = RollBackSecretResponseSchema.safeParse({
        count: 1
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid RollBackSecretResponseSchema', () => {
      const result = RollBackSecretResponseSchema.safeParse({
        count: '1' // Should be a number
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('GetAllSecretsOfProjectRequestSchema Tests', () => {
    it('should validate a valid GetAllSecretsOfProjectRequestSchema', () => {
      const result = GetAllSecretsOfProjectRequestSchema.safeParse({
        projectSlug: 'project-slug',
        decryptValue: true,
        page: 1,
        limit: 10
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid GetAllSecretsOfProjectRequestSchema', () => {
      const result = GetAllSecretsOfProjectRequestSchema.safeParse({
        projectSlug: 123, // Should be a string
        decryptValue: 'false', // Should be a boolean
        page: 1,
        limit: 10
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('GetAllSecretsOfProjectResponseSchema Tests', () => {
    it('should validate a valid GetAllSecretsOfProjectResponseSchema', () => {
      const result = GetAllSecretsOfProjectResponseSchema.safeParse({
        items: [
          {
            secret: {
              id: 'secret123',
              name: 'Secret Name',
              slug: 'secret-slug',
              createdAt: '2024-10-01T00:00:00Z',
              updatedAt: '2024-10-01T00:00:00Z',
              rotateAt: null,
              note: 'This is a note',
              lastUpdatedById: 'user123',
              projectId: 'project123',
              lastUpdatedBy: {
                id: 'user123',
                name: 'John Doe',
                profilePictureUrl: null
              }
            },
            values: [
              {
                environment: {
                  id: 'env123',
                  name: 'Development',
                  slug: 'development'
                },
                value: 'secret-value',
                version: 1,
                createdOn: '2024-10-01T00:00:00Z',
                createdBy: {
                  id: 'user123',
                  name: 'John Doe',
                  profilePictureUrl: null
                }
              }
            ]
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

    it('should not validate an invalid GetAllSecretsOfProjectResponseSchema', () => {
      const result = GetAllSecretsOfProjectResponseSchema.safeParse({
        items: 'not-an-array', // Should be an array
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
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('GetRevisionsOfSecretRequestSchema Tests', () => {
    it('should validate a valid GetRevisionsOfSecretRequestSchema', () => {
      const result = GetRevisionsOfSecretRequestSchema.safeParse({
        secretSlug: 'my-secret',
        environmentSlug: 'development',
        page: 1,
        limit: 10
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid GetRevisionsOfSecretRequestSchema', () => {
      const result = GetRevisionsOfSecretRequestSchema.safeParse({
        secretSlug: 'my-secret',
        environmentSlug: 123, // Should be a string
        page: 'one' // Should be a number
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('GetRevisionsOfSecretResponseSchema Tests', () => {
    it('should validate a valid GetRevisionsOfSecretResponseSchema', () => {
      const result = GetRevisionsOfSecretResponseSchema.safeParse({
        items: [
          {
            id: 'revision123',
            value: 'secret-value',
            version: 1,
            secretId: 'secret123',
            createdOn: '2024-10-01T00:00:00Z',
            createdById: 'user123',
            environmentId: 'env123',
            createdBy: {
              id: 'user123',
              name: 'John Doe',
              profilePictureUrl: null
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

    it('should not validate an invalid GetRevisionsOfSecretResponseSchema', () => {
      const result = GetRevisionsOfSecretResponseSchema.safeParse({
        items: [
          {
            id: 'revision123',
            value: 'secret-value',
            version: 'one', // Should be a number
            // Missing secretId
            createdOn: '2024-10-01T00:00:00Z',
            createdById: 'user123',
            environmentId: 'env123'
            // Missing createdBy
          }
        ],
        metadata: {
          page: 1,
          perPage: 'ten', // Should be a number
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
      expect(result.error?.issues).toHaveLength(4)
    })
  })
})
