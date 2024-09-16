import { APIClient } from '@api-client/core/client'
import WorkspaceController from '@api-client/controllers/workspace'

describe('Workspaces Controller Tests', () => {
  const backendUrl = process.env.BACKEND_URL

  const client = new APIClient(backendUrl)
  const workspaceController = new WorkspaceController(backendUrl)

  const email = 'johndoe@example.com'
  let workspaceSlug: string | null

  beforeEach(async () => {
    // Create the user's workspace
    const workspaceResponse = (await (
      await client.post(
        '/api/workspace',
        {
          name: 'My Workspace'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).json()) as any

    workspaceSlug = workspaceResponse.slug
  })

  afterEach(async () => {
    // Delete the workspace
    await client.delete(`/api/workspace/${workspaceSlug}`, {
      'x-e2e-user-email': email
    })
  })

  it('should return a list of workspaces for the user', async () => {
    const workspaces = (
      await workspaceController.getWorkspacesOfUser(
        {
          page: 0,
          limit: 10
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(workspaces.items).toHaveLength(1)
    expect(workspaces.items[0].name).toBe('My Workspace')

    // Check metadata
    expect(workspaces.metadata.totalCount).toEqual(1)
    expect(workspaces.metadata.links.self).toBe(
      `/workspace?page=0&limit=10&sort=name&order=asc&search=`
    )
  })

  it('should be able to fetch workspace by slug', async () => {
    const workspaceResponse = (
      await workspaceController.getWorkspace(
        {
          workspaceSlug
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(workspaceResponse.slug).toBe(workspaceSlug)
    expect(workspaceResponse.name).toBe('My Workspace')
  })

  it('should be able to create a new workspace', async () => {
    const createWorkspaceResponse = (
      await workspaceController.createWorkspace(
        {
          name: 'New Workspace',
          icon: '🤓'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(createWorkspaceResponse.name).toBe('New Workspace')

    // Fetch the created workspace
    const fetchWorkspaceResponse = (await (
      await client.get(`/api/workspace/${createWorkspaceResponse.slug}`, {
        'x-e2e-user-email': email
      })
    ).json()) as any

    expect(fetchWorkspaceResponse.name).toBe('New Workspace')

    // Delete the created workspace
    await client.delete(`/api/workspace/${createWorkspaceResponse.slug}`, {
      'x-e2e-user-email': email
    })
  })

  it('should be able to update the workspace', async () => {
    const updateWorkspaceResponse = (
      await workspaceController.updateWorkspace(
        {
          workspaceSlug,
          name: 'Updated Workspace'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(updateWorkspaceResponse.name).toBe('Updated Workspace')

    // Fetch the updated workspace
    const fetchWorkspaceResponse = (await (
      await client.get(`/api/workspace/${updateWorkspaceResponse.slug}`, {
        'x-e2e-user-email': email
      })
    ).json()) as any

    expect(fetchWorkspaceResponse.name).toBe('Updated Workspace')
  })

  it('should be able to delete the workspace', async () => {
    // Create a workspace to delete
    const createWorkspaceResponse = (await (
      await client.post(
        '/api/workspace',
        {
          name: 'Workspace to Delete'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).json()) as any

    await workspaceController.deleteWorkspace(
      {
        workspaceSlug: createWorkspaceResponse.slug
      },
      {
        'x-e2e-user-email': email
      }
    )

    // Verify that the workspace has been deleted
    const workspace = (
      await workspaceController.getWorkspace(
        {
          workspaceSlug: createWorkspaceResponse.slug
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(workspace).toBeNull()
  })

  it('should be able to export workspace data', async () => {
    const exportDataResponse = (
      await workspaceController.exportWorkspaceData(
        {
          workspaceSlug
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(exportDataResponse.name).toBe('My Workspace')
    expect(exportDataResponse.projects).toHaveLength(0)
    expect(exportDataResponse.workspaceRoles).toHaveLength(1)
  })

  it('should be able to perform a global search in the workspace', async () => {
    const globalSearchResponse = (
      await workspaceController.globalSearch(
        {
          workspaceSlug,
          search: 'work'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(globalSearchResponse.projects).toHaveLength(0)
    expect(globalSearchResponse.environments).toHaveLength(0)
    expect(globalSearchResponse.secrets).toHaveLength(0)
    expect(globalSearchResponse.variables).toHaveLength(0)
  })
})
