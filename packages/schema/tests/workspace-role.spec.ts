import {
  WorkspaceRoleSchema,
  CreateWorkspaceRoleRequestSchema,
  CreateWorkspaceRoleResponseSchema,
  UpdateWorkspaceRoleRequestSchema,
  UpdateWorkspaceRoleResponseSchema,
  DeleteWorkspaceRoleRequestSchema,
  DeleteWorkspaceRoleResponseSchema,
  CheckWorkspaceRoleExistsRequestSchema,
  CheckWorkspaceRoleExistsResponseSchema,
  GetWorkspaceRoleRequestSchema,
  GetWorkspaceRoleResponseSchema,
  GetWorkspaceRolesOfWorkspaceRequestSchema,
  GetWorkspaceRolesOfWorkspaceResponseSchema
} from '@/workspace-role'
import { authorityEnum } from '@/enums'

describe('WorkspaceRoleSchema Tests', () => {
  it('should validate a valid WorkspaceRoleSchema', () => {
    const result = WorkspaceRoleSchema.safeParse({
      id: 'role123',
      name: 'Admin Role',
      slug: 'admin-role',
      description: 'Role with admin privileges',
      colorCode: '#FF5733',
      hasAdminAuthority: true,
      createdAt: '2024-11-29T10:00:00Z',
      updatedAt: '2024-11-29T10:00:00Z',
      authorities: [authorityEnum.enum['CREATE_PROJECT']],
      workspaceId: 'workspace123',
      projects: [
        {
          project: {
            id: 'project123',
            name: 'Project Name',
            slug: 'project-slug'
          },
          environments: [
            {
              id: 'env123',
              name: 'Environment Name',
              slug: 'env-slug'
            }
          ]
        }
      ]
    })
    expect(result.success).toBe(true)
  })

  it('should validate if fields are null for WorkspaceRoleSchema', () => {
    const result = WorkspaceRoleSchema.safeParse({
      id: 'role123',
      name: 'Admin Role',
      slug: 'admin-role',
      description: null,
      colorCode: null,
      hasAdminAuthority: true,
      createdAt: '2024-11-29T10:00:00Z',
      updatedAt: '2024-11-29T10:00:00Z',
      authorities: [authorityEnum.enum['CREATE_PROJECT']],
      workspaceId: 'workspace123',
      projects: [
        {
          project: {
            id: 'project123',
            name: 'Project Name',
            slug: 'project-slug'
          },
          environments: []
        }
      ]
    })
    expect(result.success).toBe(true)
  })

  it('should not validate an invalid WorkspaceRoleSchema', () => {
    const result = WorkspaceRoleSchema.safeParse({
      id: 'role123',
      name: 'Admin Role',
      slug: 888, // Invalid type
      description: 'Role with admin privileges',
      colorCode: '#FF5733',
      hasAdminAuthority: true,
      createdAt: 'invalid-date', // Should be a valid date string
      updatedAt: '2024-11-29T10:00:00Z',
      authorities: ['INVALID_AUTHORITY'], // Invalid authority
      workspaceId: 'workspace123',
      projects: [
        {
          project: {
            id: 'project123',
            name: 'Project Name',
            slug: 'project-slug'
          }
          // missing environments
        }
      ]
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(4)
  })

  describe('CreateWorkspaceRoleRequestSchema Tests', () => {
    it('should validate if proper input is specified for CreateWorkspaceRoleRequestSchema', () => {
      const result = CreateWorkspaceRoleRequestSchema.safeParse({
        workspaceSlug: 'workspace-1',
        name: 'Admin Role',
        authorities: [authorityEnum.enum['CREATE_PROJECT']],
        projectEnvironments: [
          {
            projectSlug: 'project-1',
            environmentSlugs: ['env-1', 'env-2']
          }
        ]
      })

      expect(result.success).toBe(true)
    })

    it('should validate if only required fields are specified for CreateWorkspaceRoleRequestSchema', () => {
      const result = CreateWorkspaceRoleRequestSchema.safeParse({
        workspaceSlug: 'workspace-1',
        name: 'Viewer Role'
      })

      expect(result.success).toBe(true)
    })

    it('should validate if some optional fields are omitted for CreateWorkspaceRoleRequestSchema', () => {
      const result = CreateWorkspaceRoleRequestSchema.safeParse({
        workspaceSlug: 'workspace-1',
        name: 'Manager Role',
        colorCode: '#FF5733'
      })

      expect(result.success).toBe(true)
    })

    it('should not validate if required fields are missing for CreateWorkspaceRoleRequestSchema', () => {
      const result = CreateWorkspaceRoleRequestSchema.safeParse({
        // Missing workspaceSlug
        // Missing name
        authorities: [authorityEnum.enum['READ_USERS']]
      })

      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })

    it('should not validate if invalid types are specified for CreateWorkspaceRoleRequestSchema', () => {
      const result = CreateWorkspaceRoleRequestSchema.safeParse({
        workspaceSlug: 123,
        name: 123,
        authorities: ['invalid_authority']
      })

      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(3)
    })

    it('should validate if all optional fields are provided for CreateWorkspaceRoleRequestSchema', () => {
      const result = CreateWorkspaceRoleRequestSchema.safeParse({
        workspaceSlug: 'workspace-1',
        name: 'Custom Role',
        description: 'This is a custom role',
        colorCode: '#FF5733',
        authorities: [
          authorityEnum.enum['CREATE_PROJECT'],
          authorityEnum.enum['READ_USERS']
        ],
        projectEnvironments: [
          {
            projectSlug: 'project-1',
            environmentSlugs: ['env-1', 'env-2']
          }
        ]
      })

      expect(result.success).toBe(true)
    })
  })

  describe('CreateWorkspaceRoleResponseSchema Tests', () => {
    it('should validate a valid CreateWorkspaceRoleResponseSchema', () => {
      const result = CreateWorkspaceRoleResponseSchema.safeParse({
        id: 'role123',
        name: 'Admin Role',
        slug: 'admin-role',
        description: 'Role with admin privileges',
        colorCode: '#FF5733',
        hasAdminAuthority: true,
        createdAt: '2024-11-29T10:00:00Z',
        updatedAt: '2024-11-29T10:00:00Z',
        authorities: [authorityEnum.enum['CREATE_PROJECT']],
        workspaceId: 'workspace123',
        projects: [
          {
            project: {
              id: 'project123',
              name: 'Project Name',
              slug: 'project-slug'
            },
            environments: [
              {
                id: 'env123',
                name: 'Environment Name',
                slug: 'env-slug'
              }
            ]
          }
        ]
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid CreateWorkspaceRoleResponseSchema', () => {
      const result = CreateWorkspaceRoleResponseSchema.safeParse({
        id: 'role123',
        name: 'Admin Role',
        slug: 'admin-role',
        description: 'Role with admin privileges',
        colorCode: '#FF5733',
        hasAdminAuthority: true,
        createdAt: 'invalid-date', // Should be a valid date string
        updatedAt: '2024-11-29T10:00:00Z',
        authorities: ['INVALID_AUTHORITY'], // Invalid authority
        workspaceId: 'workspace123',
        projects: [
          {
            project: {
              id: 'project123',
              name: 'Project Name',
              slug: 'project-slug'
            },
            environments: [
              {
                id: 'env123',
                name: 'Environment Name',
                slug: 'env-slug'
              }
            ]
          }
        ]
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('UpdateWorkspaceRoleRequestSchema Tests', () => {
    it('should validate a valid UpdateWorkspaceRoleRequestSchema', () => {
      const result = UpdateWorkspaceRoleRequestSchema.safeParse({
        workspaceRoleSlug: 'admin-role',
        name: 'Updated Admin Role',
        description: 'Updated role with admin privileges',
        colorCode: '#FF5733',
        projectEnvironments: [
          {
            projectSlug: 'project-1',
            environmentSlugs: ['env-1', 'env-2']
          }
        ]
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid UpdateWorkspaceRoleRequestSchema', () => {
      const result = UpdateWorkspaceRoleRequestSchema.safeParse({
        workspaceRoleSlug: 123, // Should be a string
        name: 'Updated Admin Role',
        description: 'Updated role with admin privileges',
        colorCode: '#FF5733',
        authorities: ['INVALID_AUTHORITY'], // Invalid authority
        projectEnvironments: ['project-slug'] // Should be object
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(3)
    })
  })

  describe('UpdateWorkspaceRoleResponseSchema Tests', () => {
    it('should validate a valid UpdateWorkspaceRoleResponseSchema', () => {
      const result = UpdateWorkspaceRoleResponseSchema.safeParse({
        id: 'role123',
        name: 'Admin Role',
        slug: 'admin-role',
        description: 'Role with admin privileges',
        colorCode: '#FF5733',
        hasAdminAuthority: true,
        createdAt: '2024-11-29T10:00:00Z',
        updatedAt: '2024-11-29T10:00:00Z',
        authorities: [authorityEnum.enum['CREATE_PROJECT']],
        workspaceId: 'workspace123',
        projects: [
          {
            project: {
              id: 'project123',
              name: 'Project Name',
              slug: 'project-slug'
            },
            environments: [
              {
                id: 'env123',
                name: 'Environment Name',
                slug: 'env-slug'
              }
            ]
          }
        ]
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid UpdateWorkspaceRoleResponseSchema', () => {
      const result = UpdateWorkspaceRoleResponseSchema.safeParse({
        id: 'role123',
        name: 'Admin Role',
        slug: 'admin-role',
        description: 'Role with admin privileges',
        colorCode: '#FF5733',
        hasAdminAuthority: true,
        createdAt: 'invalid-date', // Should be a valid date string
        updatedAt: '2024-11-29T10:00:00Z',
        authorities: ['INVALID_AUTHORITY'], // Invalid authority
        workspaceId: 'workspace123',
        projects: [
          {
            project: {
              id: 'project123',
              name: 'Project Name',
              slug: 'project-slug'
            }
            // missing environments
          }
        ]
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(3)
    })
  })

  describe('DeleteWorkspaceRoleRequestSchema Tests', () => {
    it('should validate a valid DeleteWorkspaceRoleRequestSchema', () => {
      const result = DeleteWorkspaceRoleRequestSchema.safeParse({
        workspaceRoleSlug: 'admin-role'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid DeleteWorkspaceRoleRequestSchema', () => {
      const result = DeleteWorkspaceRoleRequestSchema.safeParse({
        workspaceRoleSlug: 123 // Should be a string
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('DeleteWorkspaceRoleResponseSchema Tests', () => {
    it('should validate a valid DeleteWorkspaceRoleResponseSchema', () => {
      const result = DeleteWorkspaceRoleResponseSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid DeleteWorkspaceRoleResponseSchema', () => {
      const result = DeleteWorkspaceRoleResponseSchema.safeParse({
        unexpectedField: 'value'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('CheckWorkspaceRoleExistsRequestSchema Tests', () => {
    it('should validate a valid CheckWorkspaceRoleExistsRequestSchema', () => {
      const result = CheckWorkspaceRoleExistsRequestSchema.safeParse({
        workspaceSlug: 'my-workpace-0',
        workspaceRoleName: 'admin-role123'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid CheckWorkspaceRoleExistsRequestSchema', () => {
      const result = CheckWorkspaceRoleExistsRequestSchema.safeParse({
        // Missing workspaceSlug
        workspaceRoleName: 'role-123'
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('CheckWorkspaceRoleExistsResponseSchema Tests', () => {
    it('should validate a valid CheckWorkspaceRoleExistsResponseSchema', () => {
      const result = CheckWorkspaceRoleExistsResponseSchema.safeParse({
        exists: true
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid CheckWorkspaceRoleExistsResponseSchema', () => {
      const result = CheckWorkspaceRoleExistsResponseSchema.safeParse({
        exists: 'true' // Should be a boolean
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('GetWorkspaceRoleRequestSchema Tests', () => {
    it('should validate a valid GetWorkspaceRoleRequestSchema', () => {
      const result = GetWorkspaceRoleRequestSchema.safeParse({
        workspaceRoleSlug: 'admin-role'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid GetWorkspaceRoleRequestSchema', () => {
      const result = GetWorkspaceRoleRequestSchema.safeParse({
        workspaceRoleSlug: 123 // Should be a string
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('GetWorkspaceRoleResponseSchema Tests', () => {
    it('should validate a valid GetWorkspaceRoleResponseSchema', () => {
      const result = GetWorkspaceRoleResponseSchema.safeParse({
        id: 'role123',
        name: 'Admin Role',
        slug: 'admin-role',
        description: 'Role with admin privileges',
        colorCode: '#FF5733',
        hasAdminAuthority: true,
        createdAt: '2024-11-29T10:00:00Z',
        updatedAt: '2024-11-29T10:00:00Z',
        authorities: [authorityEnum.enum['CREATE_PROJECT']],
        workspaceId: 'workspace123',
        projects: [
          {
            project: {
              id: 'project123',
              name: 'Project Name',
              slug: 'project-slug'
            },
            environments: [
              {
                id: 'env123',
                name: 'Environment Name',
                slug: 'env-slug'
              }
            ]
          }
        ]
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid GetWorkspaceRoleResponseSchema', () => {
      const result = GetWorkspaceRoleResponseSchema.safeParse({
        id: 'role123',
        name: 'Admin Role',
        slug: 'admin-role',
        description: 'Role with admin privileges',
        colorCode: '#FF5733',
        hasAdminAuthority: true,
        createdAt: 'invalid-date', // Should be a valid date string
        updatedAt: '2024-11-29T10:00:00Z',
        authorities: ['INVALID_AUTHORITY'], // Invalid authority
        workspaceId: 'workspace123',
        projects: [
          {
            project: {
              id: 'project123',
              name: 'Project Name'
              // Missing slug
            }
            // missing environments
          }
        ]
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(4)
    })
  })

  describe('GetWorkspaceRolesOfWorkspaceRequestSchema Tests', () => {
    it('should validate a valid GetWorkspaceRolesOfWorkspaceRequestSchema', () => {
      const result = GetWorkspaceRolesOfWorkspaceRequestSchema.safeParse({
        page: 1,
        limit: 10,
        sortBy: 'name',
        order: 'asc',
        search: 'admin',
        workspaceSlug: 'workspace-slug'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid GetWorkspaceRolesOfWorkspaceRequestSchema', () => {
      const result = GetWorkspaceRolesOfWorkspaceRequestSchema.safeParse({
        page: 'one', // Should be a number
        limit: 10,
        sortBy: 'name',
        search: 'admin',
        workspaceSlug: 123 // Should be a string
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('GetWorkspaceRolesOfWorkspaceResponseSchema Tests', () => {
    it('should validate a valid GetWorkspaceRolesOfWorkspaceResponseSchema', () => {
      const result = GetWorkspaceRolesOfWorkspaceResponseSchema.safeParse({
        items: [
          {
            id: 'role123',
            name: 'Admin Role',
            slug: 'admin-role',
            description: 'Role with admin privileges',
            colorCode: '#FF5733',
            hasAdminAuthority: true,
            createdAt: '2024-11-29T10:00:00Z',
            updatedAt: '2024-11-29T10:00:00Z',
            authorities: [authorityEnum.enum['CREATE_PROJECT']],
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

    it('should not validate an invalid GetWorkspaceRolesOfWorkspaceResponseSchema', () => {
      const result = GetWorkspaceRolesOfWorkspaceResponseSchema.safeParse({
        items: 'not-an-array', // Should be an array
        metadata: {
          page: 1,
          perPage: 10,
          pageCount: 1,
          // Missing totalCount
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
})
