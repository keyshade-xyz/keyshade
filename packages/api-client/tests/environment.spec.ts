import client from '@package/client'
import EnvironmentController from '@package/controllers/environment/environment'

describe('Get Environments Tests', () => {
  const email = 'johndoe@example.com'
  let projectId: string | null
  let workspaceId: string | null
  let environment: any

  beforeAll(async () => {
    //Create the user's workspace
    const workspaceResponse = (await client.post(
      '/api/workspace',
      {
        name: 'My Workspace'
      },
      {
        'x-e2e-user-email': email
      }
    )) as any

    workspaceId = workspaceResponse.id

    // Create a project
    const projectResponse = (await client.post(
      `/api/project/${workspaceId}`,
      {
        name: 'Project',
        storePrivateKey: true
      },
      {
        'x-e2e-user-email': email
      }
    )) as any

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
    const createEnvironmentResponse = await client.post(
      `/api/environment/${projectId}`,
      {
        name: 'Dev'
      },
      {
        'x-e2e-user-email': email
      }
    )

    environment = createEnvironmentResponse
  })

  afterEach(async () => {
    // Delete the environment
    await client.delete(`/api/environment/${environment.id}`, {
      'x-e2e-user-email': email
    })
  })

  it('should return a list of environments', async () => {
    const environments =
      await EnvironmentController.getAllEnvironmentsOfProject(
        {
          projectId,
          page: 0,
          limit: 10
        },
        {
          'x-e2e-user-email': email
        }
      )
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
    const environmentResponse = await EnvironmentController.getEnvironmentById(
      {
        id: environment.id
      },
      {
        'x-e2e-user-email': email
      }
    )

    expect(environmentResponse.id).toBe(environment.id)
    expect(environmentResponse.name).toBe('Dev')
  })

  it('should be able to create an environment', async () => {
    const createEnvironmentResponse =
      await EnvironmentController.createEnvironment(
        {
          projectId,
          name: 'Prod'
        },
        {
          'x-e2e-user-email': email
        }
      )

    expect(createEnvironmentResponse.name).toBe('Prod')

    const fetchEnvironmentResponse = (await client.get(
      `/api/environment/${createEnvironmentResponse.id}`,
      {
        'x-e2e-user-email': email
      }
    )) as any

    expect(fetchEnvironmentResponse.name).toBe('Prod')

    // Delete the environment
    await client.delete(`/api/environment/${createEnvironmentResponse.id}`, {
      'x-e2e-user-email': email
    })
  })

  it('should be able to update an environment', async () => {
    const updateEnvironmentResponse =
      await EnvironmentController.updateEnvironment(
        {
          id: environment.id,
          name: 'Prod'
        },
        {
          'x-e2e-user-email': email
        }
      )

    expect(updateEnvironmentResponse.name).toBe('Prod')

    const fetchEnvironmentResponse = (await client.get(
      `/api/environment/${environment.id}`,
      {
        'x-e2e-user-email': email
      }
    )) as any

    expect(fetchEnvironmentResponse.name).toBe('Prod')
  })

  it('should be able to delete an environment', async () => {
    // Create an environment
    const createEnvironmentResponse = (await client.post(
      `/api/environment/${projectId}`,
      {
        name: 'Prod'
      },
      {
        'x-e2e-user-email': email
      }
    )) as any

    await EnvironmentController.deleteEnvironment(
      {
        id: createEnvironmentResponse.id
      },
      {
        'x-e2e-user-email': email
      }
    )

    // Check if the environment is deleted
    const environments =
      await EnvironmentController.getAllEnvironmentsOfProject(
        {
          projectId
        },
        {
          'x-e2e-user-email': email
        }
      )

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
