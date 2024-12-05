import {
  IntegrationSchema,
  CreateIntegrationRequestSchema,
  CreateIntegrationResponseSchema,
  UpdateIntegrationRequestSchema,
  UpdateIntegrationResponseSchema,
  DeleteIntegrationRequestSchema,
  DeleteIntegrationResponseSchema,
  GetIntegrationRequestSchema,
  GetIntegrationResponseSchema,
  GetAllIntegrationRequestSchema,
  GetAllIntegrationResponseSchema
} from '@/integration'
import { eventTypeEnum, integrationTypeEnum } from '@/enums'

describe('Integration Schema Tests', () => {
  describe('IntegrationSchema Tests', () => {
    it('should validate a valid IntegrationSchema', () => {
      const result = IntegrationSchema.safeParse({
        id: 'integration123',
        name: 'Integration Name',
        slug: 'integration-slug',
        metadata: { key: 'value' },
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z',
        type: integrationTypeEnum.Enum.DISCORD,
        notifyOn: [eventTypeEnum.Enum.ACCEPTED_INVITATION],
        workspaceId: 'workspace123',
        projectId: 'project123',
        environmentId: 'environment123'
      })
      expect(result.success).toBe(true)
    })

    it('should validate if empty notifyOn array is provided for IntegrationSchema', () => {
      const result = IntegrationSchema.safeParse({
        id: 'integration123',
        name: 'Integration Name',
        slug: 'integration-slug',
        metadata: { key: 'value' },
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z',
        type: integrationTypeEnum.Enum.DISCORD,
        notifyOn: [],
        workspaceId: 'workspace123',
        projectId: 'project123',
        environmentId: 'environment123'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid IntegrationSchema', () => {
      const result = IntegrationSchema.safeParse({
        id: 'integration123',
        name: 'Integration Name',
        slug: 'integration-slug',
        metadata: { key: 'value' },
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z',
        type: 'INVALID_TYPE', // Invalid type
        notifyOn: ['INVALID_EVENT'], // Invalid event
        workspaceId: 'workspace123',
        projectId: 'project123',
        environmentId: 'environment123'
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('CreateIntegrationRequestSchema Tests', () => {
    it('should validate if proper input is specified', () => {
      const result = CreateIntegrationRequestSchema.safeParse({
        workspaceSlug: 'workspace123',
        name: 'Integration Test',
        type: integrationTypeEnum.Enum.DISCORD,
        metadata: { key: 'value' },
        notifyOn: [eventTypeEnum.Enum.ACCEPTED_INVITATION],
        projectSlug: 'project123',
        environmentSlug: 'environment123'
      })

      expect(result.success).toBe(true)
    })

    it('should validate if only required fields are specified', () => {
      const result = CreateIntegrationRequestSchema.safeParse({
        workspaceSlug: 'workspace123',
        name: 'Integration Test',
        type: integrationTypeEnum.Enum.DISCORD,
        metadata: { key: 'value' }
      })

      expect(result.success).toBe(true)
    })

    it('should not validate if invalid values are specified', () => {
      const result = CreateIntegrationRequestSchema.safeParse({
        workspaceSlug: 'workspace123',
        name: 123,
        type: integrationTypeEnum.Enum.DISCORD,
        metadata: 'invalid metadata'
      })

      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })

    it('should not validate if required values are not specified', () => {
      const result = CreateIntegrationRequestSchema.safeParse({
        metadata: { key: 'value' }
      })

      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(3)
    })

    it('should validate with optional fields omitted', () => {
      const result = CreateIntegrationRequestSchema.safeParse({
        workspaceSlug: 'workspace123',
        name: 'Integration Test',
        type: integrationTypeEnum.Enum.DISCORD,
        metadata: { key: 'value' }
      })

      expect(result.success).toBe(true)
    })

    it('should not validate if empty notifyOn array is provided', () => {
      const result = CreateIntegrationRequestSchema.safeParse({
        workspaceSlug: 'workspace123',
        name: 'Integration Test',
        type: integrationTypeEnum.Enum.DISCORD,
        metadata: { key: 'value' },
        notifyOn: []
      })

      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('CreateIntegrationResponseSchema Tests', () => {
    it('should validate a valid CreateIntegrationResponseSchema', () => {
      const result = CreateIntegrationResponseSchema.safeParse({
        id: 'integration123',
        name: 'Integration Name',
        slug: 'integration-slug',
        metadata: { key: 'value' },
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z',
        type: integrationTypeEnum.Enum.DISCORD,
        notifyOn: [eventTypeEnum.Enum.ACCEPTED_INVITATION],
        workspaceId: 'workspace123',
        projectId: 'project123',
        environmentId: 'environment123'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid CreateIntegrationResponseSchema', () => {
      const result = CreateIntegrationResponseSchema.safeParse({
        id: 'integration123',
        name: 'Integration Name',
        slug: 'integration-slug',
        metadata: { key: 'value' },
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z',
        type: 'INVALID_TYPE', // Invalid type
        notifyOn: ['INVALID_EVENT'], // Invalid event
        workspaceId: 'workspace123',
        projectId: 'project123',
        environmentId: 'environment123'
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('UpdateIntegrationRequestSchema Tests', () => {
    it('should validate a valid UpdateIntegrationRequestSchema', () => {
      const result = UpdateIntegrationRequestSchema.safeParse({
        integrationSlug: 'integration-slug',
        name: 'Updated Integration Name',
        notifyOn: [eventTypeEnum.Enum.PROJECT_DELETED],
        metadata: { key: 'new-value' }
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid UpdateIntegrationRequestSchema', () => {
      const result = UpdateIntegrationRequestSchema.safeParse({
        integrationSlug: 123, // Should be a string
        name: 'Updated Integration Name',
        notifyOn: ['EVENT_A'], // Invalid event
        metadata: { key: 'new-value' }
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('UpdateIntegrationResponseSchema Tests', () => {
    it('should validate a valid UpdateIntegrationResponseSchema', () => {
      const result = UpdateIntegrationResponseSchema.safeParse({
        id: 'integration123',
        name: 'Integration Name',
        slug: 'integration-slug',
        metadata: { key: 'value' },
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z',
        type: integrationTypeEnum.Enum.DISCORD,
        notifyOn: [eventTypeEnum.Enum.ACCEPTED_INVITATION],
        workspaceId: 'workspace123',
        projectId: 'project123',
        environmentId: 'environment123'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid UpdateIntegrationResponseSchema', () => {
      const result = UpdateIntegrationResponseSchema.safeParse({
        id: 'integration123',
        name: 'Integration Name',
        slug: 'integration-slug',
        metadata: { key: 'value' },
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z',
        type: 'INVALID_TYPE', // Invalid type
        notifyOn: ['INVALID_EVENT'], // Invalid event
        workspaceId: 'workspace123',
        projectId: 'project123',
        environmentId: 'environment123'
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('DeleteIntegrationRequestSchema Tests', () => {
    it('should validate a valid DeleteIntegrationRequestSchema', () => {
      const result = DeleteIntegrationRequestSchema.safeParse({
        integrationSlug: 'integration-slug'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid DeleteIntegrationRequestSchema', () => {
      const result = DeleteIntegrationRequestSchema.safeParse({
        integrationSlug: 123 // Should be a string
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('DeleteIntegrationResponseSchema Tests', () => {
    it('should validate a valid DeleteIntegrationResponseSchema', () => {
      const result = DeleteIntegrationResponseSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid DeleteIntegrationResponseSchema', () => {
      const result = DeleteIntegrationResponseSchema.safeParse({
        unexpectedField: 'value'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('GetIntegrationRequestSchema Tests', () => {
    it('should validate a valid GetIntegrationRequestSchema', () => {
      const result = GetIntegrationRequestSchema.safeParse({
        integrationSlug: 'integration-slug'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid GetIntegrationRequestSchema', () => {
      const result = GetIntegrationRequestSchema.safeParse({
        integrationSlug: 123 // Should be a string
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('GetIntegrationResponseSchema Tests', () => {
    it('should validate a valid GetIntegrationResponseSchema', () => {
      const result = GetIntegrationResponseSchema.safeParse({
        id: 'integration123',
        name: 'Integration Name',
        slug: 'integration-slug',
        metadata: { key: 'value' },
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z',
        type: integrationTypeEnum.Enum.GITHUB,
        notifyOn: [eventTypeEnum.Enum.ACCEPTED_INVITATION],
        workspaceId: 'workspace123',
        projectId: 'project123',
        environmentId: 'environment123',
        workspace: {
          id: 'workspace123',
          name: 'Workspace Name',
          slug: 'workspace-slug',
          icon: 'workspace-icon',
          isFreeTier: true,
          createdAt: '2024-10-01T00:00:00Z',
          updatedAt: '2024-10-01T00:00:00Z',
          ownerId: 'owner123',
          isDefault: false,
          lastUpdatedById: 'user123'
        }
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid GetIntegrationResponseSchema', () => {
      const result = GetIntegrationResponseSchema.safeParse({
        id: 'integration123',
        name: 'Integration Name',
        slug: 'integration-slug',
        metadata: { key: 'value' },
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z',
        type: 'INVALID_TYPE', // Invalid type
        notifyOn: ['INVALID_EVENT'], // Invalid event
        workspaceId: 'workspace123',
        projectId: 'project123',
        environmentId: 'environment123'
        // Missing workspace field
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(3)
    })
  })

  describe('GetAllIntegrationRequestSchema Tests', () => {
    it('should validate a valid GetAllIntegrationRequestSchema', () => {
      const result = GetAllIntegrationRequestSchema.safeParse({
        workspaceSlug: 'workspace123',
        page: 1,
        limit: 10
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid GetAllIntegrationRequestSchema', () => {
      const result = GetAllIntegrationRequestSchema.safeParse({
        workspaceSlug: 123, // Should be a string
        page: 1
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('GetAllIntegrationResponseSchema Tests', () => {
    it('should validate a valid GetAllIntegrationResponseSchema', () => {
      const result = GetAllIntegrationResponseSchema.safeParse({
        items: [
          {
            id: 'integration123',
            name: 'Integration Name',
            slug: 'integration-slug',
            metadata: { key: 'value' },
            createdAt: '2024-10-01T00:00:00Z',
            updatedAt: '2024-10-01T00:00:00Z',
            type: integrationTypeEnum.Enum.DISCORD,
            notifyOn: [eventTypeEnum.Enum.ACCEPTED_INVITATION],
            workspaceId: 'workspace123',
            projectId: 'project123',
            environmentId: 'environment123'
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

    it('should not validate an invalid GetAllIntegrationResponseSchema', () => {
      const result = GetAllIntegrationResponseSchema.safeParse({
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
})
