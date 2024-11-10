import {
  InviteMemberSchema,
  CreateWorkspaceRequestSchema,
  UpdateWorkspaceRequestSchema,
  DeleteWorkspaceRequestSchema,
  GetWorkspaceRequestSchema,
  ExportDataRequestSchema,
  GlobalSearchRequestSchema,
  CreateWorkspaceResponseSchema,
  UpdateWorkspaceResponseSchema,
  DeleteWorkspaceResponseSchema,
  GetWorkspaceResponseSchema,
  ExportDataResponseSchema,
  GetAllWorkspacesOfUserResponseSchema,
  GlobalSearchResponseSchema,
  GetAllWorkspacesOfUserRequestSchema
} from '@/workspace/workspace'

describe('Workspace Schema Tests', () => {
  it('should validate if proper input is specified for InviteMemberSchema', () => {
    const result = InviteMemberSchema.safeParse({
      email: 'test@example.com',
      roleSlugs: ['role1', 'role2']
    })

    expect(result.success).toBe(true)
  })

  it('should validate if only required fields are specified for InviteMemberSchema', () => {
    const result = InviteMemberSchema.safeParse({
      email: 'test@example.com'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if required fields are missing for InviteMemberSchema', () => {
    const result = InviteMemberSchema.safeParse({
      roleSlugs: ['role1']
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  it('should not validate if invalid types are specified for InviteMemberSchema', () => {
    const result = InviteMemberSchema.safeParse({
      email: 123,
      roleSlugs: 'invalid_role'
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(2)
  })

  it('should not validate if roleIds are specified instead of roleSlugs for InviteMemberSchema', () => {
    const result = InviteMemberSchema.safeParse({
      roleIds: ['role1', 'role2'] //should be roleSlugs
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  it('should validate if proper input is specified for CreateWorkspaceRequestSchema', () => {
    const result = CreateWorkspaceRequestSchema.safeParse({
      name: 'Workspace Test',
      icon: 'icon.png'
    })

    expect(result.success).toBe(true)
  })

  it('should validate if only required fields are specified for CreateWorkspaceRequestSchema', () => {
    const result = CreateWorkspaceRequestSchema.safeParse({
      name: 'Workspace Test'
    })

    expect(result.success).toBe(true)
  })

  it('should validate if optional fields are omitted for CreateWorkspaceRequestSchema', () => {
    const result = CreateWorkspaceRequestSchema.safeParse({
      name: 'Workspace Test'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if required fields are missing for CreateWorkspaceRequestSchema', () => {
    const result = CreateWorkspaceRequestSchema.safeParse({
      isDefault: true
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  it('should not validate if invalid types are specified for CreateWorkspaceRequestSchema', () => {
    const result = CreateWorkspaceRequestSchema.safeParse({
      name: 123,
      isDefault: 'true'
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(2)
  })

  it('should validate with proper input for CreateWorkspaceResponseSchema', () => {
    const result = CreateWorkspaceResponseSchema.safeParse({
      id: 'workspace-id',
      name: 'Workspace Test',
      slug: 'workspace-slug',
      icon: 'icon.png',
      isFreeTier: true,
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      ownerId: 'owner-id',
      isDefault: false,
      lastUpdatedBy: 'user-id'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if required fields are missing for CreateWorkspaceResponseSchema', () => {
    const result = CreateWorkspaceResponseSchema.safeParse({
      id: 'workspace-id',
      name: 'Workspace Test',
      // slug is missing
      icon: 'icon.png',
      isFreeTier: true,
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      ownerId: 'owner-id',
      isDefault: false,
      lastUpdatedBy: 'user-id'
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
    expect(result.error?.issues[0].path).toEqual(['slug'])
  })

  it('should validate if proper input is specified for UpdateWorkspaceRequestSchema', () => {
    const result = UpdateWorkspaceRequestSchema.safeParse({
      name: 'Updated Workspace Test',
      icon: 'new-icon.png',
      workspaceSlug: 'workspace-slug'
    })

    expect(result.success).toBe(true)
  })

  it('should validate if only required fields are specified for UpdateWorkspaceRequestSchema', () => {
    const result = UpdateWorkspaceRequestSchema.safeParse({
      workspaceSlug: 'workspace-slug'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if invalid types are provided for UpdateWorkspaceRequestSchema', () => {
    const result = UpdateWorkspaceRequestSchema.safeParse({
      name: 123 // should be a string
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(2)
    expect(result.error?.issues[0].path).toEqual(['name'])
    expect(result.error?.issues[1].path).toEqual(['workspaceSlug'])
  })

  it('should validate with proper input for UpdateWorkspaceResponseSchema', () => {
    const result = UpdateWorkspaceResponseSchema.safeParse({
      id: 'workspace-id',
      name: 'Updated Workspace',
      slug: 'workspace-slug',
      icon: 'new-icon.png',
      isFreeTier: true,
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-02T00:00:00Z',
      ownerId: 'owner-id',
      isDefault: false,
      lastUpdatedBy: 'user-id'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if required fields are missing for UpdateWorkspaceResponseSchema', () => {
    const result = UpdateWorkspaceResponseSchema.safeParse({
      id: 'workspace-id',
      name: 'Updated Workspace',
      // slug is missing
      icon: 'new-icon.png',
      isFreeTier: true,
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-02T00:00:00Z',
      ownerId: 'owner-id',
      isDefault: false,
      lastUpdatedBy: 'user-id'
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
    expect(result.error?.issues[0].path).toEqual(['slug'])
  })

  it('should validate if proper input is specified for DeleteWorkspaceRequestSchema', () => {
    const result = DeleteWorkspaceRequestSchema.safeParse({
      workspaceSlug: 'workspace-slug'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if unexpected fields are provided for DeleteWorkspaceResponseSchema', () => {
    const result = DeleteWorkspaceResponseSchema.safeParse({
      unexpectedField: 'value'
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  it('should validate if proper input is specified for GetWorkspaceRequestSchema', () => {
    const result = GetWorkspaceRequestSchema.safeParse({
      workspaceSlug: 'workspace-slug'
    })

    expect(result.success).toBe(true)
  })

  it('should validate with proper input for GetWorkspaceResponseSchema', () => {
    const result = GetWorkspaceResponseSchema.safeParse({
      id: 'workspace-id',
      name: 'Workspace Test',
      slug: 'workspace-slug',
      icon: 'icon.png',
      isFreeTier: true,
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      ownerId: 'owner-id',
      isDefault: false,
      lastUpdatedBy: 'user-id'
    })

    expect(result.success).toBe(true)
  })

  it('should validate when correct page and limit are provided for GetAllWorkspacesOfUserRequestSchema', () => {
    const result = GetAllWorkspacesOfUserRequestSchema.safeParse({
      page: 1,
      limit: 10
    })

    expect(result.success).toBe(true)
  })

  it('should validate with proper input for GetAllWorkspacesOfUserResponseSchema', () => {
    const result = GetAllWorkspacesOfUserResponseSchema.safeParse({
      items: [
        {
          id: 'workspace-id',
          name: 'Workspace Test',
          slug: 'workspace-slug',
          icon: 'icon.png',
          isFreeTier: true,
          createdAt: '2024-10-01T00:00:00Z',
          updatedAt: '2024-10-01T00:00:00Z',
          ownerId: 'owner-id',
          isDefault: false,
          lastUpdatedBy: 'user-id'
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

  it('should not validate if items are not an array in GetAllWorkspacesOfUserResponseSchema', () => {
    const result = GetAllWorkspacesOfUserResponseSchema.safeParse({
      items: 'not-an-array',
      total: 1,
      page: 1,
      limit: 10
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['items'])
  })

  it('should validate if proper input is specified for ExportDataRequestSchema', () => {
    const result = ExportDataRequestSchema.safeParse({
      workspaceSlug: 'workspace-slug'
    })

    expect(result.success).toBe(true)
  })

  it('should validate with proper input for ExportDataResponseSchema', () => {
    const result = ExportDataResponseSchema.safeParse({
      name: 'Workspace Test',
      icon: 'icon.png',
      workspaceRoles: [
        {
          name: 'Admin',
          description: 'Administrator role',
          colorCode: '#FF0000',
          hasAdminAuthority: true,
          authorities: ['ALL']
        }
      ],
      projects: [
        {
          name: 'Project A',
          description: 'Description of Project A',
          publicKey: 'public-key',
          privateKey: 'private-key',
          storePrivateKey: true,
          accessLevel: 'GLOBAL',
          environments: [
            {
              name: 'Development',
              description: 'Development Environment'
            }
          ],
          secrets: [
            {
              name: 'API_KEY',
              note: 'API Key for external service',
              rotateAt: '720',
              versions: [
                {
                  value: 'secret-value',
                  version: 1
                }
              ]
            }
          ],
          variables: [
            {
              name: 'ENV_VAR',
              note: 'Environment Variable',
              versions: [
                {
                  value: 'variable-value',
                  version: 1
                }
              ]
            }
          ]
        }
      ]
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if required fields are missing in ExportDataResponseSchema', () => {
    const result = ExportDataResponseSchema.safeParse({
      // name is missing
      icon: 'icon.png',
      workspaceRoles: [],
      projects: []
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['name'])
  })

  it('should validate if proper input is specified for GlobalSearchRequestSchema', () => {
    const result = GlobalSearchRequestSchema.safeParse({
      workspaceSlug: 'workspace-slug',
      search: 'search-term'
    })

    expect(result.success).toBe(true)
  })

  it('should validate with proper input for GlobalSearchResponseSchema', () => {
    const result = GlobalSearchResponseSchema.safeParse({
      projects: [
        {
          slug: 'project-slug',
          name: 'Project Name',
          description: 'Project Description'
        }
      ],
      environments: [
        {
          slug: 'environment-slug',
          name: 'Environment Name',
          description: 'Environment Description'
        }
      ],
      secrets: [
        {
          slug: 'secret-slug',
          name: 'Secret Name',
          note: 'Secret Note'
        }
      ],
      variables: [
        {
          slug: 'variable-slug',
          name: 'Variable Name',
          note: 'Variable Note'
        }
      ]
    })

    expect(result.success).toBe(true)
  })

  it('should not validate when required fields are missing for GlobalSearchResponseSchema', () => {
    const result = GlobalSearchResponseSchema.safeParse({
      projects: [
        {
          slug: 'project-slug',
          name: 'Project Name'
          // description is missing
        }
      ],
      environments: [],
      secrets: [],
      variables: []
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual([
      'projects',
      0,
      'description'
    ])
  })
})
