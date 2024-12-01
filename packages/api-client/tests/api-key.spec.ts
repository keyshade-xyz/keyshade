import { APIClient } from '@api-client/core/client'
import ApiKeyController from '@api-client/controllers/api-key'
import type { ApiKey } from '@keyshade/schema'

describe('Api-Key Controller Tests', () => {
  const backendURL = process.env.BACKEND_URL

  const client = new APIClient(backendURL)
  const apiKeyController = new ApiKeyController(backendURL)

  const email = 'johndoe@example.com'
  let workspaceSlug: string | null
  let apiKey: ApiKey | null

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
  })

  afterAll(async () => {
    // Delete the workspace
    await client.delete(`/api/workspace/${workspaceSlug}`, {
      'x-e2e-user-email': email
    })
  })

  // Create Api Key
  it('should create an api key', async () => {
    const response = await apiKeyController.crateApiKey(
      {
        name: 'My API Key',
        authorities: ['READ_PROJECT']
      },
      {
        'x-e2e-user-email': email
      }
    )

    expect(response.success).toBe(true)
    expect(response.data.name).toBe('My API Key')
    expect(response.data.authorities).toEqual(['READ_PROJECT'])

    apiKey = response.data
  })

  // Update Api Key
  it('should update an api key', async () => {
    const response = await apiKeyController.updateApiKey(
      {
        apiKeySlug: apiKey.slug,
        name: 'My Updated API Key',
        authorities: ['CREATE_PROJECT']
      },
      {
        'x-e2e-user-email': email
      }
    )

    expect(response.success).toBe(true)
    expect(response.data.name).toBe('My Updated API Key')
    expect(response.data.authorities).toEqual(['CREATE_PROJECT'])

    apiKey.name = response.data.name
    apiKey.slug = response.data.slug
  })

  // Delete Api Key
  it('should delete an api key', async () => {
    const response = await apiKeyController.deleteApiKey(
      {
        apiKeySlug: apiKey.slug
      },
      {
        'x-e2e-user-email': email
      }
    )

    expect(response.success).toBe(true)
    expect(response.data).toBe(null)

    apiKey = null
  })

  // Get Api Keys of User
  it('should get all api keys of a user', async () => {
    // Create an API key
    const createResponse = await apiKeyController.crateApiKey(
      {
        name: 'My API Key 2',
        authorities: ['READ_PROJECT', 'READ_WORKSPACE', 'READ_SECRET']
      },
      {
        'x-e2e-user-email': email
      }
    )

    apiKey = createResponse.data

    const response = await apiKeyController.getApiKeysOfUser(
      {
        page: 0
      },
      {
        'x-e2e-user-email': email
      }
    )

    expect(response.success).toBe(true)
    expect(response.data.items).toHaveLength(1)

    const metadata = response.data.metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toBe(
      `/api-key?page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(metadata.links.first).toBe(
      `/api-key?page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(metadata.links.previous).toEqual(null)
    expect(metadata.links.next).toEqual(null)
    expect(metadata.links.last).toBe(
      `/api-key?page=0&limit=10&sort=name&order=asc&search=`
    )
  })

  // Get Api Key
  it('should get an api key', async () => {
    const response = await apiKeyController.getApiKey(
      {
        apiKeySlug: apiKey.slug
      },
      {
        'x-e2e-user-email': email
      }
    )

    expect(response.success).toBe(true)
    expect(response.data.name).toBe(apiKey.name)
    expect(response.data.slug).toBe(apiKey.slug)
    expect(response.data.authorities).toEqual(apiKey.authorities)
  })

  // Can Access Live Updates
  it('should be able to access live updates', async () => {
    const response = await apiKeyController.canAccessLiveUpdatesApiKey(null, {
      'x-e2e-user-email': email
    })

    expect(response.success).toBe(true)
    expect(response.data.canAccessLiveUpdates).toBe(true)
  })
})
