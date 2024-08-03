import { APIClient } from '../src/core/client'
import EventController from '../src/controllers/event/event'
export enum EventSource {
  SECRET = 'SECRET',
  VARIABLE = 'VARIABLE',
  ENVIRONMENT = 'ENVIRONMENT',
  PROJECT = 'PROJECT',
  WORKSPACE = 'WORKSPACE',
  WORKSPACE_ROLE = 'WORKSPACE_ROLE',
  INTEGRATION = 'INTEGRATION'
}

describe('Get Event Controller', () => {
  const backendUrl = process.env.BACKEND_URL

  const client = new APIClient(backendUrl)
  const eventController = new EventController(backendUrl)
  const email = 'johndoe@example.com'
  let projectId: string | null
  let workspaceId: string | null
  let secret: any
  let variable: any
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
    console.log(workspaceResponse)
    workspaceId = workspaceResponse.id
  })

  afterAll(async () => {
    // Delete the workspace
    await client.delete(`/api/workspace/${workspaceId}`, {
      'x-e2e-user-email': email
    })
  })

  it('should fetch a Project Event', async () => {
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
    const events = await eventController.getEvents(
      { workspaceId, source: 'PROJECT' },
      { 'x-e2e-user-email': email }
    )
    console.log(events.data.items)
    expect(events.data.items[0].source).toBe(EventSource.PROJECT)
    expect(events.data.items[0].metadata.projectId).toBe(projectId)
    expect(events.data.items[0].metadata.name).toBe('Project')
  })

  it('should fetch a Environment Event', async () => {
    const environmentResponse = (await (
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
    const events = await eventController.getEvents(
      { workspaceId, source: EventSource.ENVIRONMENT },
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
    const secretRepsonse = (await (
      await client.post(
        `/api/secret/${projectId}`,
        {
          name: 'My secret',
          entries: [
            {
              value: 'My value',
              environmentId: environment.id
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
      { workspaceId, source: EventSource.SECRET },
      { 'x-e2e-user-email': email }
    )
    expect(events.data.items[0].source).toBe('SECRET')
    expect(events.data.items[0].metadata.secretId).toBe(secretRepsonse.id)
    expect(events.data.items[0].metadata.name).toBe('My secret')
    secret = secretRepsonse
  })

  it('should fetch a Variable Event', async () => {
    const variableResponse = (await (
      await client.post(
        `/api/variable/${projectId}`,
        {
          name: 'My variable',
          entries: [
            {
              value: 'My value',
              environmentId: environment.id
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
      { workspaceId, source: EventSource.VARIABLE },
      { 'x-e2e-user-email': email }
    )
    expect(events.data.items[0].source).toBe('VARIABLE')
    expect(events.data.items[0].metadata.variableId).toBe(variableResponse.id)
    expect(events.data.items[0].metadata.name).toBe('My variable')
    variable = variableResponse
  })
})
