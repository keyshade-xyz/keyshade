import { APIClient } from '@api-client/core/client'
import EnvironmentController from '@api-client/controllers/environment'

describe('Environments Controller Tests', () => {
  const backendUrl = process.env.BACKEND_URL

  const client = new APIClient(backendUrl)
  const environmentController = new EnvironmentController(backendUrl)

  const email = 'johndoe@example.com'
  let projectSlug: string | null
  let workspaceSlug: string | null
  let environmentSlug: string | null

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

    workspaceSlug = workspaceResponse.slug

    // Create a project
    const projectResponse = (await (
      await client.post(
        `/api/project/${workspaceSlug}`,
        {
          name: 'Project',
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
    // Delete the workspace
    await client.delete(`/api/workspace/${workspaceSlug}`, {
      'x-e2e-user-email': email
    })
  })

  beforeEach(async () => {
    // Create an environment
    const createEnvironmentResponse = (await (
      await client.post(
        `/api/environment/${projectSlug}`,
        {
          name: 'Dev'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).json()) as any

    environmentSlug = createEnvironmentResponse.slug
  })

  afterEach(async () => {
    // Delete the environment
    await client.delete(`/api/environment/${environmentSlug}`, {
      'x-e2e-user-email': email
    })
  })

  it('should return a list of environments', async () => {
    const environments = (
      await environmentController.getAllEnvironmentsOfProject(
        {
          projectSlug,
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
      `/environment/all/${projectSlug}?page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(environments.metadata.links.first).toBe(
      `/environment/all/${projectSlug}?page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(environments.metadata.links.previous).toBeNull()
    expect(environments.metadata.links.next).toBeNull()
    expect(environments.metadata.links.last).toBe(
      `/environment/all/${projectSlug}?page=0&limit=10&sort=name&order=asc&search=`
    )
  })

  it('should be able to fetch environment by slug', async () => {
    const environmentResponse = (
      await environmentController.getEnvironment(
        {
          slug: environmentSlug
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(environmentResponse.slug).toBe(environmentSlug)
    expect(environmentResponse.name).toBe('Dev')
  })

  it('should be able to create an environment', async () => {
    const createEnvironmentResponse = (
      await environmentController.createEnvironment(
        {
          projectSlug: projectSlug,
          name: 'Prod'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(createEnvironmentResponse.name).toBe('Prod')

    const fetchEnvironmentResponse = (await (
      await client.get(`/api/environment/${createEnvironmentResponse.slug}`, {
        'x-e2e-user-email': email
      })
    ).json()) as any

    expect(fetchEnvironmentResponse.name).toBe('Prod')

    // Delete the environment
    await client.delete(`/api/environment/${createEnvironmentResponse.slug}`, {
      'x-e2e-user-email': email
    })
  })

  it('should be able to update an environment', async () => {
    const updateEnvironmentResponse = (
      await environmentController.updateEnvironment(
        {
          slug: environmentSlug,
          name: 'Prod'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(updateEnvironmentResponse.name).toBe('Prod')

    const fetchEnvironmentResponse = (await (
      await client.get(`/api/environment/${updateEnvironmentResponse.slug}`, {
        'x-e2e-user-email': email
      })
    ).json()) as any

    expect(fetchEnvironmentResponse.name).toBe('Prod')

    // Delete this environment
    await client.delete(`/api/environment/${updateEnvironmentResponse.slug}`, {
      'x-e2e-user-email': email
    })
  })

  it('should be able to delete an environment', async () => {
    // Create an environment
    const createEnvironmentResponse = (await (
      await client.post(
        `/api/environment/${projectSlug}`,
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
        slug: createEnvironmentResponse.slug
      },
      {
        'x-e2e-user-email': email
      }
    )

    // Check if the environment is deleted
    const environments = (
      await environmentController.getAllEnvironmentsOfProject(
        {
          projectSlug
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).data

    expect(environments.items).toHaveLength(2)
    expect(environments.metadata.totalCount).toEqual(2)
    expect(environments.metadata.links.self).toBe(
      `/environment/all/${projectSlug}?page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(environments.metadata.links.first).toBe(
      `/environment/all/${projectSlug}?page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(environments.metadata.links.previous).toBeNull()
    expect(environments.metadata.links.next).toBeNull()
    expect(environments.metadata.links.last).toBe(
      `/environment/all/${projectSlug}?page=0&limit=10&sort=name&order=asc&search=`
    )
  })
})
