import { APIClient } from '../src/core/client'
import EnvironmentController from '../src/controllers/environment'

describe('Environments Controller Tests', () => {
  const backendUrl = process.env.BACKEND_URL

  const client = new APIClient(backendUrl)
  const environmentController = new EnvironmentController(backendUrl)

  const email = 'johndoe@example.com'
  let projectId: string | null
  let workspaceId: string | null
  let environmentId: string | null

  beforeAll(async () => {
    //Create the user's workspace
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

    workspaceId = workspaceResponse.id

    // Create a project
    const projectResponse = (await (
      await client.post(
        `/api/project/${workspaceId}`,
        {
          name: 'Project',
          storePrivateKey: true
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).json()) as any

    projectId = projectResponse.id
  })

  afterAll(async () => {
    // Delete the workspace
    await client.delete(`/api/workspace/${workspaceId}`, {
      'x-e2e-user-email': email
    })
  })

  beforeEach(async () => {
    // Create an environment
    const createEnvironmentResponse = (await (
      await client.post(
        `/api/environment/${projectId}`,
        {
          name: 'Dev'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).json()) as any

    environmentId = createEnvironmentResponse.id
  })

  afterEach(async () => {
    // Delete the environment
    await client.delete(`/api/environment/${environmentId}`, {
      'x-e2e-user-email': email
    })
  })

  it('should return a list of environments', async () => {
    const environments = (
      await environmentController.getAllEnvironmentsOfProject(
        {
          projectId,
          page: 0,
          limit: 10
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(environments.items).toHaveLength(2)
    expect(environments.items[0].name).toBe('Default')

    //check metadata
    expect(environments.metadata.totalCount).toEqual(2)
    expect(environments.metadata.links.self).toBe(
      `/environment/all/${projectId}?page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(environments.metadata.links.first).toBe(
      `/environment/all/${projectId}?page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(environments.metadata.links.previous).toBeNull()
    expect(environments.metadata.links.next).toBeNull()
    expect(environments.metadata.links.last).toBe(
      `/environment/all/${projectId}?page=0&limit=10&sort=name&order=asc&search=`
    )
  })

  it('should be able to fetch environment by ID', async () => {
    const environmentResponse = (
      await environmentController.getEnvironmentById(
        {
          id: environmentId
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(environmentResponse.id).toBe(environmentId)
    expect(environmentResponse.name).toBe('Dev')
  })

  it('should be able to create an environment', async () => {
    const createEnvironmentResponse = (
      await environmentController.createEnvironment(
        {
          projectId,
          name: 'Prod'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(createEnvironmentResponse.name).toBe('Prod')

    const fetchEnvironmentResponse = (await (
      await client.get(`/api/environment/${createEnvironmentResponse.id}`, {
        'x-e2e-user-email': email
      })
    ).json()) as any

    expect(fetchEnvironmentResponse.name).toBe('Prod')

    // Delete the environment
    await client.delete(`/api/environment/${createEnvironmentResponse.id}`, {
      'x-e2e-user-email': email
    })
  })

  it('should be able to update an environment', async () => {
    const updateEnvironmentResponse = (
      await environmentController.updateEnvironment(
        {
          id: environmentId,
          name: 'Prod'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(updateEnvironmentResponse.name).toBe('Prod')

    const fetchEnvironmentResponse = (await (
      await client.get(`/api/environment/${environmentId}`, {
        'x-e2e-user-email': email
      })
    ).json()) as any

    expect(fetchEnvironmentResponse.name).toBe('Prod')
  })

  it('should be able to delete an environment', async () => {
    // Create an environment
    const createEnvironmentResponse = (await (
      await client.post(
        `/api/environment/${projectId}`,
        {
          name: 'Prod'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).json()) as any

    await environmentController.deleteEnvironment(
      {
        id: createEnvironmentResponse.id
      },
      {
        'x-e2e-user-email': email
      }
    )

    // Check if the environment is deleted
    const environments = (
      await environmentController.getAllEnvironmentsOfProject(
        {
          projectId
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(environments.items).toHaveLength(2)
    expect(environments.metadata.totalCount).toEqual(2)
    expect(environments.metadata.links.self).toBe(
      `/environment/all/${projectId}?page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(environments.metadata.links.first).toBe(
      `/environment/all/${projectId}?page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(environments.metadata.links.previous).toBeNull()
    expect(environments.metadata.links.next).toBeNull()
    expect(environments.metadata.links.last).toBe(
      `/environment/all/${projectId}?page=0&limit=10&sort=name&order=asc&search=`
    )
  })
})
