import { APIClient } from '@api-client/core/client'
import UserController from '@api-client/controllers/user'

describe('User Controller Tests', () => {
  const backendURL = process.env.BACKEND_URL

  const client = new APIClient(backendURL)
  const userController = new UserController(backendURL)

  const email = 'johndoe@example.com'
  let projectSlug: string | null
  let workspaceSlug: string | null

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

    await client.post(
      `/api/environment/${projectSlug}`,
      {
        name: 'Dev'
      },
      {
        'x-e2e-user-email': email
      }
    )
  })

  afterAll(async () => {
    // Delete the workspace
    await client.delete(`/api/workspace/${workspaceSlug}`, {
      'x-e2e-user-email': email
    })
  })

  // Get Current User
  it('should get current user', async () => {
    const user = await userController.getSelf({ 'x-e2e-user-email': email })

    expect(user.data.email).toBe('johndoe@example.com')
  })

  // Update Current User
  it('should update current user', async () => {
    const user = await userController.updateSelf(
      { name: 'Jane Doe' },
      { 'x-e2e-user-email': email }
    )

    expect(user.data.name).toBe('Jane Doe')
  })
})
