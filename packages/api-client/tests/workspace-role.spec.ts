import { APIClient } from '@api-client/core/client'
import WorkspaceRoleController from '@api-client/controllers/workspace-role'
import {
  CreateWorkspaceRoleRequest,
  GetWorkspaceRolesOfWorkspaceRequest
} from '@keyshade/schema'

describe('Workspace Role Controller Tests', () => {
  const backendUrl = process.env.BACKEND_URL
  const client = new APIClient(backendUrl)
  const workspaceRoleController = new WorkspaceRoleController(backendUrl)
  const email = 'johndoe@example.com'
  let workspaceSlug: string | null
  let workspaceRoleSlug: string | null
  let projectSlug: string | null

  beforeAll(async () => {
    // Create a workspace for the tests
    const workspaceResponse = (await (
      await client.post(
        '/api/workspace',
        { name: 'My Workspace' },
        { 'x-e2e-user-email': email }
      )
    ).json()) as any

    workspaceSlug = workspaceResponse.slug

    // Create a project for the tests
    const projectResponse = (await (
      await client.post(
        `/api/project/${workspaceSlug}`,
        {
          name: 'My Project',
          storePrivateKey: true
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).json()) as any

    projectSlug = projectResponse.slug
  })

  afterAll(async () => {
    await client.delete(
      `/api/workspace/${workspaceSlug}/projects/${projectSlug}`,
      {
        'x-e2e-user-email': email
      }
    )
    // Delete the workspace after tests
    await client.delete(`/api/workspace/${workspaceSlug}`, {
      'x-e2e-user-email': email
    })
  })

  beforeEach(async () => {
    // Create a workspace role for the tests
    const createWorkspaceRoleRequest: CreateWorkspaceRoleRequest = {
      workspaceSlug,
      name: 'Developer',
      description: 'Role for developers',
      colorCode: '#FF0000',
      authorities: ['READ_WORKSPACE', 'READ_PROJECT'],
      projectEnvironments: [{ projectSlug }]
    }

    const createWorkspaceRoleResponse = (
      await workspaceRoleController.createWorkspaceRole(
        createWorkspaceRoleRequest,
        { 'x-e2e-user-email': email }
      )
    ).data

    workspaceRoleSlug = createWorkspaceRoleResponse.slug
  })

  afterEach(async () => {
    // Delete the workspace role after each test
    await workspaceRoleController.deleteWorkspaceRole(
      { workspaceRoleSlug: workspaceRoleSlug! },
      { 'x-e2e-user-email': email }
    )
  })

  it('should return a list of workspace roles', async () => {
    const request: GetWorkspaceRolesOfWorkspaceRequest = {
      workspaceSlug: workspaceSlug!,
      page: 0,
      limit: 10,
      sort: 'createdAt',
      order: 'desc',
      search: ''
    }

    const roles = (
      await workspaceRoleController.getWorkspaceRolesOfWorkspace(request, {
        'x-e2e-user-email': email
      })
    ).data

    expect(roles.items).toHaveLength(2)
    expect(roles.items[0].name).toBe('Developer')
  })

  it('should fetch a workspace role by slug', async () => {
    const role = (
      await workspaceRoleController.getWorkspaceRole(
        { workspaceRoleSlug: workspaceRoleSlug! },
        { 'x-e2e-user-email': email }
      )
    ).data

    expect(role.slug).toBe(workspaceRoleSlug)
    expect(role.name).toBe('Developer')
  })

  it('should create a new workspace role', async () => {
    const createWorkspaceRoleRequest: CreateWorkspaceRoleRequest = {
      workspaceSlug: workspaceSlug!,
      name: 'ReadOnly',
      description: 'Role for admins',
      colorCode: '#0000FF',
      authorities: ['READ_WORKSPACE'],
      projectEnvironments: []
    }

    const createRoleResponse = (
      await workspaceRoleController.createWorkspaceRole(
        createWorkspaceRoleRequest,
        { 'x-e2e-user-email': email }
      )
    ).data

    expect(createRoleResponse.name).toBe('ReadOnly')

    // Delete the newly created role
    await workspaceRoleController.deleteWorkspaceRole(
      { workspaceRoleSlug: createRoleResponse.slug },
      { 'x-e2e-user-email': email }
    )
  })

  it('should update a workspace role', async () => {
    const updateRoleResponse = (
      await workspaceRoleController.updateWorkspaceRole(
        {
          workspaceRoleSlug: workspaceRoleSlug!,
          name: 'Lead Developer'
        },
        { 'x-e2e-user-email': email }
      )
    ).data

    expect(updateRoleResponse.name).toBe('Lead Developer')
  })

  it('should delete a workspace role', async () => {
    await workspaceRoleController.deleteWorkspaceRole(
      { workspaceRoleSlug },
      { 'x-e2e-user-email': email }
    )

    // Verify role deletion
    const roles = (
      await workspaceRoleController.getWorkspaceRolesOfWorkspace(
        {
          workspaceSlug: workspaceSlug!,
          page: 0,
          limit: 10,
          sort: 'name',
          order: 'asc',
          search: ''
        },
        { 'x-e2e-user-email': email }
      )
    ).data

    expect(roles.items.some((role) => role.name === 'Developer')).toBe(false)
  })

  it('should check if a workspace role exists', async () => {
    const roleExists = (
      await workspaceRoleController.checkWorkspaceRoleExists(
        { workspaceSlug: workspaceSlug!, workspaceRoleName: 'Developer' },
        { 'x-e2e-user-email': email }
      )
    ).data

    expect(roleExists.exists).toBe(true)
  })

  it('should create a new workspace role with a project', async () => {
    const createWorkspaceRoleRequest: CreateWorkspaceRoleRequest = {
      workspaceSlug: workspaceSlug!,
      name: 'ReadOnly',
      description: 'Role with project access',
      colorCode: '#0000FF',
      authorities: ['READ_WORKSPACE'],
      projectEnvironments: [{ projectSlug }]
    }

    const createRoleResponse = (
      await workspaceRoleController.createWorkspaceRole(
        createWorkspaceRoleRequest,
        { 'x-e2e-user-email': email }
      )
    ).data

    expect(createRoleResponse.name).toBe('ReadOnly')

    // Delete the newly created role
    await workspaceRoleController.deleteWorkspaceRole(
      { workspaceRoleSlug: createRoleResponse.slug },
      { 'x-e2e-user-email': email }
    )
  })

  it('should fetch a workspace role with its assigned project', async () => {
    const role = (
      await workspaceRoleController.getWorkspaceRole(
        { workspaceRoleSlug: workspaceRoleSlug! },
        { 'x-e2e-user-email': email }
      )
    ).data

    expect(role.slug).toBe(workspaceRoleSlug)
  })
})
