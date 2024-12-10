// event.spec.ts
import { GetEventsRequestSchema, GetEventsResponseSchema } from '@/event'

describe('Event Schema Tests', () => {
  describe('GetEventsRequestSchema Tests', () => {
    it('should validate a valid GetEventsRequestSchema', () => {
      const result = GetEventsRequestSchema.safeParse({
        workspaceSlug: 'workspace-slug',
        source: 'WORKSPACE'
      })
      expect(result.success).toBe(true)
    })

    it('should validate GetEventsRequestSchema when only workspaceSlug is provided', () => {
      const result = GetEventsRequestSchema.safeParse({
        workspaceSlug: 'workspace-slug'
      })
      expect(result.success).toBe(true)
    })

    it('should validate GetEventsRequestSchema when severity is also provided', () => {
      const result = GetEventsRequestSchema.safeParse({
        workspaceSlug: 'workspace-slug',
        source: 'INTEGRATION',
        severity: 'WARN'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid GetEventsRequestSchema', () => {
      const result = GetEventsRequestSchema.safeParse({
        workspaceSlug: 123, // Should be a string
        source: 'PROJECT_CREATED' // Invalid source
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('GetEventsResponseSchema Tests', () => {
    it('should validate a valid GetEventsResponseSchema', () => {
      const result = GetEventsResponseSchema.safeParse({
        items: [
          {
            id: 'event123',
            source: 'SECRET',
            triggerer: 'USER',
            severity: 'INFO',
            type: 'SECRET_UPDATED',
            timestamp: '2024-10-01T00:00:00Z',
            metadata: {
              name: 'Event Name',
              projectName: 'Project Name',
              projectId: 'project123',
              variableId: 'variable123',
              environmentId: 'env123',
              secretId: 'secret123',
              workspaceId: 'workspace123',
              workspaceName: 'Workspace Name'
            },
            title: 'Event Title',
            description: 'Event Description',
            itemId: 'item123',
            userId: 'user123',
            workspaceId: 'workspace123'
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

    it('should not validate an invalid GetEventsResponseSchema', () => {
      const result = GetEventsResponseSchema.safeParse({
        items: [
          {
            id: 'event123',
            source: 'PROJECT_CREATED',
            triggerer: 'user123',
            severity: 'high',
            type: 'update',
            timestamp: '2024-10-01T00:00:00Z',
            metadata: {
              name: 'Event Name',
              projectName: 'Project Name',
              projectId: 'project123',
              variableId: 'variable123',
              environmentId: 'env123',
              secretId: 'secret123',
              workspaceId: 'workspace123',
              workspaceName: 'Workspace Name'
            },
            title: 'Event Title',
            description: 'Event Description',
            itemId: 'item123',
            userId: 123, // Should be a string
            workspaceId: 'workspace123'
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
      expect(result.error?.issues).toHaveLength(5)
    })
  })
})
