import {
  VariableSchema,
  CreateVariableRequestSchema,
  CreateVariableResponseSchema,
  UpdateVariableRequestSchema,
  UpdateVariableResponseSchema,
  RollBackVariableRequestSchema,
  RollBackVariableResponseSchema,
  DeleteVariableRequestSchema,
  DeleteVariableResponseSchema,
  GetAllVariablesOfProjectRequestSchema,
  GetAllVariablesOfProjectResponseSchema
} from '@/variable'

describe('Variable Schema Tests', () => {
  describe('VariableSchema Tests', () => {
    it('should validate a valid VariableSchema', () => {
      const result = VariableSchema.safeParse({
        id: 'variable123',
        name: 'Variable Name',
        slug: 'variable-slug',
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z',
        note: 'This is a note',
        lastUpdatedById: 'user123',
        projectId: 'project123',
        project: {
          workspaceId: 'workspace123'
        },
        versions: [
          {
            value: 'variable-value',
            environment: {
              id: 'env123',
              slug: 'development'
            }
          }
        ]
      })
      expect(result.success).toBe(true)
    })

    it('should validate a valid VariableSchema with no note', () => {
      const result = VariableSchema.safeParse({
        id: 'variable123',
        name: 'Variable Name',
        slug: 'variable-slug',
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z',
        note: null,
        lastUpdatedById: 'user123',
        projectId: 'project123',
        project: {
          workspaceId: 'workspace123'
        },
        versions: [
          {
            value: 'variable-value',
            environment: {
              id: 'env123',
              slug: 'development'
            }
          }
        ]
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid VariableSchema', () => {
      const result = VariableSchema.safeParse({
        id: 'variable123',
        name: 'Variable Name',
        slug: 'variable-slug',
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z',
        note: 'This is a note',
        lastUpdatedById: 'user123',
        projectId: 'project123',
        project: {
          workspaceId: 'workspace123'
        },
        versions: [
          {
            value: 'variable-value',
            environmentId: 'env123',
            environment: {
              id: 'env123'
              // Missing slug
            }
          }
        ]
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('CreateVariableRequestSchema Tests', () => {
    it('should validate if proper input is specified for CreateVariableRequestSchema', () => {
      const result = CreateVariableRequestSchema.safeParse({
        projectSlug: 'projectTest',
        name: 'Variable Test',
        entries: [{ environmentSlug: 'env123', value: 'variable-value' }]
      })

      expect(result.success).toBe(true)
    })

    it('should validate if only required fields are specified for CreateVariableRequestSchema', () => {
      const result = CreateVariableRequestSchema.safeParse({
        projectSlug: 'projectTest',
        name: 'Variable Test'
      })

      expect(result.success).toBe(true)
    })

    it('should not validate if required fields are missing for CreateVariableRequestSchema', () => {
      const result = CreateVariableRequestSchema.safeParse({
        entries: [{ environmentSlug: 'env123', value: 'variable-value' }]
      })

      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })

    it('should not validate if invalid types are specified for CreateVariableRequestSchema', () => {
      const result = CreateVariableRequestSchema.safeParse({
        projectSlug: 123,
        name: 456,
        entries: [{ environmentSlug: 'env123', value: 456 }]
      })

      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(3)
    })

    it('should validate if optional fields are omitted for CreateVariableRequestSchema', () => {
      const result = CreateVariableRequestSchema.safeParse({
        projectSlug: 'projectTest',
        name: 'Variable Test',
        entries: [{ environmentSlug: 'env123', value: 'variable-value' }]
      })

      expect(result.success).toBe(true)
    })

    it('should validate if note field is provided for CreateVariableRequestSchema', () => {
      const result = CreateVariableRequestSchema.safeParse({
        projectSlug: 'projectTest',
        name: 'Variable Test',
        note: 'This is a note',
        entries: [{ environmentSlug: 'env123', value: 'variable-value' }]
      })

      expect(result.success).toBe(true)
    })
  })

  describe('CreateVariableResponseSchema Tests', () => {
    it('should validate a valid CreateVariableResponseSchema', () => {
      const result = CreateVariableResponseSchema.safeParse({
        id: 'variable123',
        name: 'Variable Name',
        slug: 'variable-slug',
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z',
        note: 'This is a note',
        lastUpdatedById: 'user123',
        projectId: 'project123',
        project: {
          workspaceId: 'workspace123'
        },
        versions: [
          {
            value: 'variable-value',
            environment: {
              id: 'env123',
              slug: 'development'
            }
          }
        ]
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid CreateVariableResponseSchema', () => {
      const result = CreateVariableResponseSchema.safeParse({
        id: 'variable123',
        name: 'Variable Name',
        slug: 'variable-slug',
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z',
        note: 'This is a note',
        lastUpdatedById: 'user123',
        projectId: 'project123',
        project: {
          workspaceId: 'workspace123'
        },
        versions: [
          {
            value: 'variable-value',
            environment: {
              id: 'env123'
              // Missing slug
            }
          }
        ]
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('UpdateVariableRequestSchema Tests', () => {
    it('should validate a valid UpdateVariableRequestSchema', () => {
      const result = UpdateVariableRequestSchema.safeParse({
        variableSlug: 'variable-slug',
        name: 'Updated Variable Name',
        note: 'Updated note',
        entries: [
          {
            value: 'variable-value',
            environmentSlug: 'development'
          }
        ]
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid UpdateVariableRequestSchema', () => {
      const result = UpdateVariableRequestSchema.safeParse({
        variableSlug: 123, // Should be a string
        name: 'Updated Variable Name',
        note: 'Updated note',
        entries: [
          {
            value: 'variable-value',
            environmentSlug: 'development'
          }
        ]
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('UpdateVariableResponseSchema Tests', () => {
    it('should validate a valid UpdateVariableResponseSchema', () => {
      const result = UpdateVariableResponseSchema.safeParse({
        variable: {
          id: 'variable123',
          name: 'Variable Name',
          slug: 'variable-slug',
          note: 'This is a note'
        },
        updatedVersions: [
          {
            id: 'variable123',
            value: 'variable-value',
            version: 4,
            environment: {
              id: 'env123',
              slug: 'development'
            }
          }
        ]
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid UpdateVariableResponseSchema', () => {
      const result = UpdateVariableResponseSchema.safeParse({
        variable: {
          id: 'variable123',
          name: 'Variable Name',
          slug: 'variable-slug',
          note: 'This is a note'
        },
        updatedVersions: [
          {
            id: 'variable123',
            value: 'variable-value',
            // Missing version
            environment: {
              id: 'env123'
              // Missing slug
            }
          }
        ]
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('RollBackVariableRequestSchema Tests', () => {
    it('should validate a valid RollBackVariableRequestSchema', () => {
      const result = RollBackVariableRequestSchema.safeParse({
        variableSlug: 'variable-slug',
        version: 1,
        environmentSlug: 'development'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid RollBackVariableRequestSchema', () => {
      const result = RollBackVariableRequestSchema.safeParse({
        variableSlug: 'variable-slug',
        version: 'one', // Should be a number
        environmentSlug: 'development'
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('RollBackVariableResponseSchema Tests', () => {
    it('should validate a valid RollBackVariableResponseSchema', () => {
      const result = RollBackVariableResponseSchema.safeParse({
        count: 1
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid RollBackVariableResponseSchema', () => {
      const result = RollBackVariableResponseSchema.safeParse({
        count: '1' // Should be a number
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('DeleteVariableRequestSchema Tests', () => {
    it('should validate a valid DeleteVariableRequestSchema', () => {
      const result = DeleteVariableRequestSchema.safeParse({
        variableSlug: 'variable-slug'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid DeleteVariableRequestSchema', () => {
      const result = DeleteVariableRequestSchema.safeParse({
        variableSlug: 123 // Should be a string
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('DeleteVariableResponseSchema Tests', () => {
    it('should validate a valid DeleteVariableResponseSchema', () => {
      const result = DeleteVariableResponseSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid DeleteVariableResponseSchema', () => {
      const result = DeleteVariableResponseSchema.safeParse({
        unexpectedField: 'value'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('GetAllVariablesOfProjectRequestSchema Tests', () => {
    it('should validate a valid GetAllVariablesOfProjectRequestSchema', () => {
      const result = GetAllVariablesOfProjectRequestSchema.safeParse({
        projectSlug: 'project-slug',
        page: 1,
        limit: 10
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid GetAllVariablesOfProjectRequestSchema', () => {
      const result = GetAllVariablesOfProjectRequestSchema.safeParse({
        projectSlug: 123, // Should be a string
        page: 1,
        limit: 10
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('GetAllVariablesOfProjectResponseSchema Tests', () => {
    it('should validate a valid GetAllVariablesOfProjectResponseSchema', () => {
      const result = GetAllVariablesOfProjectResponseSchema.safeParse({
        items: [
          {
            variable: {
              id: 'variable123',
              name: 'Variable Name',
              slug: 'variable-slug',
              createdAt: '2024-10-01T00:00:00Z',
              updatedAt: '2024-10-01T00:00:00Z',
              note: 'This is a note',
              lastUpdatedById: 'user123',
              projectId: 'project123',
              lastUpdatedBy: {
                id: 'user123',
                name: 'John Doe'
              }
            },
            values: [
              {
                environment: {
                  id: 'env123',
                  name: 'Development',
                  slug: 'development'
                },
                value: 'variable-value',
                version: 1
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

    it('should not validate an invalid GetAllVariablesOfProjectResponseSchema', () => {
      const result = GetAllVariablesOfProjectResponseSchema.safeParse({
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
