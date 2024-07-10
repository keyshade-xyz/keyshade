import client from '@package/client'
import EnvironmentController from '@package/controllers/environment/environment'

describe('Get Environments Tests', () => {
  const email = 'johndoe@example.com'
  let projectId: string | null
  let workspaceId: string | null
  let environment: any

  beforeAll(async () => {
    try {
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
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  })

  afterAll(async () => {
    try {
      // Delete the workspace
      await client.delete(`/api/workspace/${workspaceId}`, {
        'x-e2e-user-email': email
      })
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
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
    try {
      const environments =
        await EnvironmentController.getAllEnvironmentsOfProject(
          {
            projectId
          },
          {
            'x-e2e-user-email': email
          }
        )

      expect(environments).toHaveLength(2)
      expect(environments[0].name).toBe('Default')
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  })

  it('should be able to fetch environment by ID', async () => {
    try {
      const environmentResponse =
        await EnvironmentController.getEnvironmentById(
          {
            id: environment.id
          },
          {
            'x-e2e-user-email': email
          }
        )

      expect(environmentResponse.id).toBe(environment.id)
      expect(environmentResponse.name).toBe('Dev')
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  })

  it('should be able to create an environment', async () => {
    try {
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
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  })

  it('should be able to update an environment', async () => {
    try {
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
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
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

    try {
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

      expect(environments).toHaveLength(2)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  })
})
