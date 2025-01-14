import { APIClient } from '../src/core/client'
import EventController from '../src/controllers/event'
export enum EventSource {
  SECRET = 'SECRET',
  VARIABLE = 'VARIABLE',
  ENVIRONMENT = 'ENVIRONMENT',
  PROJECT = 'PROJECT',
  WORKSPACE = 'WORKSPACE',
  WORKSPACE_ROLE = 'WORKSPACE_ROLE',
  INTEGRATION = 'INTEGRATION'
}

describe('Event Controller Tests', () => {
  const backendUrl = process.env.BACKEND_URL

  const client = new APIClient(backendUrl)
  const eventController = new EventController(backendUrl)
  const email = 'johndoe@example.com'
  let projectSlug: string | null
  let workspaceSlug: string | null
  let environment: any

  beforeAll(async () => {
    //Create the user's workspace
    const workspaceResponse = (await (
      await client.post(
        '/api/workspace',
        {
          name: 'Event Workspace'
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

  it('should fetch a Project Event', async () => {
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
    const events = await eventController.getEvents(
      { workspaceSlug, source: 'PROJECT' },
      { 'x-e2e-user-email': email }
    )
    expect(events.data.items[0].source).toBe(EventSource.PROJECT)
    expect(events.data.items[0].metadata.name).toBe('Project')
  })

  it('should fetch a Environment Event', async () => {
    const environmentResponse = (await (
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
    const events = await eventController.getEvents(
      { workspaceSlug, source: EventSource.ENVIRONMENT },
      { 'x-e2e-user-email': email }
    )
    expect(events.data.items[0].source).toBe('ENVIRONMENT')
    expect(events.data.items[0].metadata.environmentId).toBe(
      environmentResponse.id
    )
    expect(events.data.items[0].metadata.name).toBe('Dev')
    environment = environmentResponse
  })

  it('should fetch a Secret Event', async () => {
    const secretResponse = (await (
      await client.post(
        `/api/secret/${projectSlug}`,
        {
          name: 'My secret',
          entries: [
            {
              value: 'My value',
              environmentSlug: environment.slug
            }
          ],
          note: 'Some note',
          rotateAfter: '720'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).json()) as any
    const events = await eventController.getEvents(
      { workspaceSlug, source: EventSource.SECRET },
      { 'x-e2e-user-email': email }
    )
    expect(events.data.items[0].source).toBe('SECRET')
    expect(events.data.items[0].metadata.secretId).toBe(
      secretResponse.secret.id
    )
    expect(events.data.items[0].metadata.name).toBe('My secret')
  })

  it('should fetch a Variable Event', async () => {
    const variableResponse = (await (
      await client.post(
        `/api/variable/${projectSlug}`,
        {
          name: 'My variable',
          entries: [
            {
              value: 'My value',
              environmentSlug: environment.slug
            }
          ],
          note: 'Some note'
        },
        {
          'x-e2e-user-email': email
        }
      )
    ).json()) as any
    const events = await eventController.getEvents(
      { workspaceSlug, source: EventSource.VARIABLE },
      { 'x-e2e-user-email': email }
    )
    expect(events.data.items[0].source).toBe('VARIABLE')
    expect(events.data.items[0].metadata.variableId).toBe(
      variableResponse.variable.id
    )
    expect(events.data.items[0].metadata.name).toBe('My variable')
  })
})
