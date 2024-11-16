import {
  ProjectSchema,
  CreateProjectRequestSchema,
  CreateProjectResponseSchema,
  UpdateProjectRequestSchema,
  UpdateProjectResponseSchema,
  DeleteProjectRequestSchema,
  DeleteProjectResponseSchema,
  GetProjectRequestSchema,
  GetProjectResponseSchema,
  ForkProjectRequestSchema,
  ForkProjectResponseSchema,
  SyncProjectRequestSchema,
  SyncProjectResponseSchema,
  UnlinkProjectRequestSchema,
  UnlinkProjectResponseSchema,
  GetForkRequestSchema,
  GetForkResponseSchema,
  GetAllProjectsRequestSchema,
  GetAllProjectsResponseSchema
} from '@/project/project'
import { projectAccessLevelEnum } from '@/enums'

describe('Project Schema Tests', () => {
  // Tests for ProjectSchema
  it('should validate a valid ProjectSchema', () => {
    const result = ProjectSchema.safeParse({
      id: 'project123',
      name: 'Project Name',
      slug: 'project-slug',
      description: 'Project Description',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      publicKey: 'public-key',
      privateKey: 'private-key',
      storePrivateKey: true,
      isDisabled: false,
      accessLevel: 'admin',
      pendingCreation: false,
      isForked: false,
      lastUpdatedById: 'user123',
      workspaceId: 'workspace123',
      forkedFromId: null
    })

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid ProjectSchema', () => {
    const result = ProjectSchema.safeParse({
      id: 'project123',
      name: 'Project Name'
      // Missing required fields
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(14)
  })

  it('should not validate ProjectSchema when isForked is true but forkedFromId is null', () => {
    const result = ProjectSchema.safeParse({
      id: 'project123',
      name: 'Project Name',
      slug: 'project-slug',
      description: 'Project Description',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      publicKey: 'public-key',
      privateKey: 'private-key',
      storePrivateKey: true,
      isDisabled: false,
      accessLevel: 'admin',
      pendingCreation: false,
      isForked: true,
      lastUpdatedById: 'user123',
      workspaceId: 'workspace123',
      forkedFromId: null
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
    expect(result.error?.issues[0].message).toBe('Invalid input')
  })

  // Tests for CreateProjectRequestSchema
  it('should validate if proper input is specified for CreateProjectRequestSchema', () => {
    const result = CreateProjectRequestSchema.safeParse({
      name: 'Project Test',
      workspaceSlug: 'workspace123',
      accessLevel: projectAccessLevelEnum.Enum.PRIVATE,
      environments: [{ name: 'Environment 1', projectId: 'project123' }]
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if invalid values are specified for CreateProjectRequestSchema', () => {
    const result = CreateProjectRequestSchema.safeParse({
      name: 123,
      accessLevel: 'invalid_access_level'
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(3)
  })

  it('should validate if only required fields are specified for CreateProjectRequestSchema', () => {
    const result = CreateProjectRequestSchema.safeParse({
      name: 'Project Test',
      workspaceSlug: 'workspace123',
      accessLevel: projectAccessLevelEnum.Enum.PRIVATE
    })

    expect(result.success).toBe(true)
  })

  // Tests for CreateProjectResponseSchema
  it('should validate a valid CreateProjectResponseSchema', () => {
    const result = CreateProjectResponseSchema.safeParse({
      id: 'project123',
      name: 'Project Name',
      slug: 'project-slug',
      description: 'Project Description',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      publicKey: 'public-key',
      privateKey: 'private-key',
      storePrivateKey: true,
      isDisabled: false,
      accessLevel: 'admin',
      pendingCreation: false,
      isForked: false,
      lastUpdatedById: 'user123',
      workspaceId: 'workspace123',
      forkedFromId: null
    })

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid CreateProjectResponseSchema', () => {
    const result = CreateProjectResponseSchema.safeParse({
      id: 'project123',
      name: 'Project Name'
      // Missing required fields
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(14)
  })

  // Tests for UpdateProjectRequestSchema
  it('should validate a valid UpdateProjectRequestSchema', () => {
    const result = UpdateProjectRequestSchema.safeParse({
      projectSlug: 'project-slug',
      name: 'Updated Project Name'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid UpdateProjectRequestSchema', () => {
    const result = UpdateProjectRequestSchema.safeParse({
      projectSlug: 123, // Should be a string
      name: 'Updated Project Name'
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  it('should validate if only required fields are specified for UpdateProjectRequestSchema', () => {
    const result = UpdateProjectRequestSchema.safeParse({
      projectSlug: 'project-slug'
    })

    expect(result.success).toBe(true)
  })

  // Tests for UpdateProjectResponseSchema
  it('should validate a valid UpdateProjectResponseSchema', () => {
    const result = UpdateProjectResponseSchema.safeParse({
      id: 'project123',
      name: 'Project Name',
      slug: 'project-slug',
      description: 'Project Description',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      publicKey: 'public-key',
      privateKey: 'private-key',
      storePrivateKey: true,
      isDisabled: false,
      accessLevel: 'admin',
      pendingCreation: false,
      isForked: false,
      lastUpdatedById: 'user123',
      workspaceId: 'workspace123',
      forkedFromId: null
    })

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid UpdateProjectResponseSchema', () => {
    const result = UpdateProjectResponseSchema.safeParse({
      id: 'project123',
      name: 'Project Name'
      // Missing required fields
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(14)
  })

  // Tests for DeleteProjectRequestSchema
  it('should validate a valid DeleteProjectRequestSchema', () => {
    const result = DeleteProjectRequestSchema.safeParse({
      projectSlug: 'project-slug'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid DeleteProjectRequestSchema', () => {
    const result = DeleteProjectRequestSchema.safeParse({
      projectSlug: 123 // Should be a string
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  // Tests for DeleteProjectResponseSchema
  it('should validate a valid DeleteProjectResponseSchema', () => {
    const result = DeleteProjectResponseSchema.safeParse(undefined)

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid DeleteProjectResponseSchema', () => {
    const result = DeleteProjectResponseSchema.safeParse({
      unexpectedField: 'value'
    })

    expect(result.success).toBe(false)
  })

  // Tests for GetProjectRequestSchema
  it('should validate a valid GetProjectRequestSchema', () => {
    const result = GetProjectRequestSchema.safeParse({
      projectSlug: 'project-slug'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid GetProjectRequestSchema', () => {
    const result = GetProjectRequestSchema.safeParse({
      projectSlug: 123 // Should be a string
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  // Tests for GetProjectResponseSchema
  it('should validate a valid GetProjectResponseSchema', () => {
    const result = GetProjectResponseSchema.safeParse({
      id: 'project123',
      name: 'Project Name',
      slug: 'project-slug',
      description: 'Project Description',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      publicKey: 'public-key',
      privateKey: 'private-key',
      storePrivateKey: true,
      isDisabled: false,
      accessLevel: 'admin',
      pendingCreation: false,
      isForked: false,
      lastUpdatedById: 'user123',
      workspaceId: 'workspace123',
      forkedFromId: null
    })

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid GetProjectResponseSchema', () => {
    const result = GetProjectResponseSchema.safeParse({
      id: 'project123',
      name: 'Project Name'
      // Missing required fields
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(14)
  })

  // Tests for ForkProjectRequestSchema
  it('should validate if proper input is specified for ForkProjectRequestSchema', () => {
    const result = ForkProjectRequestSchema.safeParse({
      projectSlug: 'project123',
      workspaceSlug: 'workspace123',
      name: 'Forked Project',
      storePrivateKey: true
    })

    expect(result.success).toBe(true)
  })

  it('should validate if only required fields are present for ForkProjectRequestSchema', () => {
    const result = ForkProjectRequestSchema.safeParse({
      projectSlug: 'project123'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if invalid values are specified for ForkProjectRequestSchema', () => {
    const result = ForkProjectRequestSchema.safeParse({
      projectSlug: 456,
      workspaceSlug: 123,
      storePrivateKey: 'invalid_boolean'
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(3)
  })

  // Tests for ForkProjectResponseSchema
  it('should validate a valid ForkProjectResponseSchema', () => {
    const result = ForkProjectResponseSchema.safeParse({
      id: 'project123',
      name: 'Project Name',
      slug: 'project-slug',
      description: 'Project Description',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      publicKey: 'public-key',
      privateKey: 'private-key',
      storePrivateKey: true,
      isDisabled: false,
      accessLevel: 'admin',
      pendingCreation: false,
      isForked: false,
      lastUpdatedById: 'user123',
      workspaceId: 'workspace123',
      forkedFromId: null
    })

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid ForkProjectResponseSchema', () => {
    const result = ForkProjectResponseSchema.safeParse({
      id: 'project123',
      name: 'Project Name'
      // Missing required fields
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(14)
  })

  // Tests for SyncProjectRequestSchema
  it('should validate a valid SyncProjectRequestSchema', () => {
    const result = SyncProjectRequestSchema.safeParse({
      projectSlug: 'project-slug',
      hardSync: true
    })

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid SyncProjectRequestSchema', () => {
    const result = SyncProjectRequestSchema.safeParse({
      projectSlug: 123, // Should be a string
      hardSync: true
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  // Tests for SyncProjectResponseSchema
  it('should validate a valid SyncProjectResponseSchema', () => {
    const result = SyncProjectResponseSchema.safeParse(undefined)

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid SyncProjectResponseSchema', () => {
    const result = SyncProjectResponseSchema.safeParse({
      unexpectedField: 'value'
    })

    expect(result.success).toBe(false)
  })

  // Tests for UnlinkProjectRequestSchema
  it('should validate a valid UnlinkProjectRequestSchema', () => {
    const result = UnlinkProjectRequestSchema.safeParse({
      projectSlug: 'project-slug'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid UnlinkProjectRequestSchema', () => {
    const result = UnlinkProjectRequestSchema.safeParse({
      projectSlug: 123 // Should be a string
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  // Tests for UnlinkProjectResponseSchema
  it('should validate a valid UnlinkProjectResponseSchema', () => {
    const result = UnlinkProjectResponseSchema.safeParse(undefined)

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid UnlinkProjectResponseSchema', () => {
    const result = UnlinkProjectResponseSchema.safeParse({
      unexpectedField: 'value'
    })

    expect(result.success).toBe(false)
  })

  // Tests for GetForkRequestSchema
  it('should validate a valid GetForkRequestSchema', () => {
    const result = GetForkRequestSchema.safeParse({
      projectSlug: 'project-slug',
      workspaceSlug: 'workspace-slug',
      page: 1,
      perPage: 10
    })

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid GetForkRequestSchema', () => {
    const result = GetForkRequestSchema.safeParse({
      projectSlug: 123, // Should be a string
      workspaceSlug: 'workspace-slug',
      page: 1,
      perPage: 10
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  // Tests for GetForkResponseSchema
  it('should validate a valid GetForkResponseSchema', () => {
    const result = GetForkResponseSchema.safeParse({
      items: [
        {
          id: 'project123',
          name: 'Project Name',
          slug: 'project-slug',
          description: 'Project Description',
          createdAt: '2024-10-01T00:00:00Z',
          updatedAt: '2024-10-01T00:00:00Z',
          publicKey: 'public-key',
          privateKey: 'private-key',
          storePrivateKey: true,
          isDisabled: false,
          accessLevel: 'admin',
          pendingCreation: false,
          isForked: false,
          lastUpdatedById: 'user123',
          workspaceId: 'workspace123',
          forkedFromId: null
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

  it('should not validate an invalid GetForkResponseSchema', () => {
    const result = GetForkResponseSchema.safeParse({
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
  })

  // Tests for GetAllProjectsRequestSchema
  it('should validate a valid GetAllProjectsRequestSchema', () => {
    const result = GetAllProjectsRequestSchema.safeParse({
      workspaceSlug: 'workspace-slug',
      page: 1,
      perPage: 10
    })

    expect(result.success).toBe(true)
  })

  it('should not validate an invalid GetAllProjectsRequestSchema', () => {
    const result = GetAllProjectsRequestSchema.safeParse({
      workspaceSlug: 123, // Should be a string
      page: 1,
      perPage: 10
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  // Tests for GetAllProjectsResponseSchema
  it('should validate a valid GetAllProjectsResponseSchema', () => {
    const result = GetAllProjectsResponseSchema.safeParse({
      items: [
        {
          id: 'project123',
          name: 'Project Name',
          slug: 'project-slug',
          description: 'Project Description',
          createdAt: '2024-10-01T00:00:00Z',
          updatedAt: '2024-10-01T00:00:00Z',
          publicKey: 'public-key',
          privateKey: 'private-key',
          storePrivateKey: true,
          isDisabled: false,
          accessLevel: 'admin',
          pendingCreation: false,
          isForked: false,
          lastUpdatedById: 'user123',
          workspaceId: 'workspace123',
          forkedFromId: null
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

  it('should not validate an invalid GetAllProjectsResponseSchema', () => {
    const result = GetAllProjectsResponseSchema.safeParse({
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
