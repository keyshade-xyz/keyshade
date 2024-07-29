import client from '@package/client'
import EventController from '@package/controllers/event/event'
import { EventSource } from '@package/types/event.types'

describe('Get Event Controller', () => {
  const email = 'johndoe@example.com'
  let projectId: string | null
  let workspaceId: string | null
  let secret: any
  let variable: any
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
  })

  afterAll(async () => {
    // Delete the workspace
    await client.delete(`/api/workspace/${workspaceId}`, {
      'x-e2e-user-email': email
    })
  })

  it('should fetch a Project Event', async () => {
    const project = (await client.post(
      `/api/project/${workspaceId}`,
      {
        name: 'Project',
        storePrivateKey: true
      },
      {
        'x-e2e-user-email': email
      }
    )) as any
    projectId = project.id

    const events = await EventController.getEvents(
      { workspaceId, source: EventSource.PROJECT },
      { 'x-e2e-user-email': email }
    )
    console.log(events)
    expect(events[0].source).toBe('PROJECT')
    expect(events[0].metadata.projectId).toBe(project.id)
    expect(events[0].metadata.name).toBe('Project')
  })

  it('should fetch a Environment Event', async () => {
    const environmentResponse = (await client.post(
      `/api/environment/${projectId}`,
      {
        name: 'Dev'
      },
      {
        'x-e2e-user-email': email
      }
    )) as any
    const events = await EventController.getEvents(
      { workspaceId, source: EventSource.ENVIRONMENT },
      { 'x-e2e-user-email': email }
    )
    console.log(events)
    expect(events[0].source).toBe('ENVIRONMENT')
    expect(events[0].metadata.environmentId).toBe(environmentResponse.id)
    expect(events[0].metadata.name).toBe('Dev')
    environment = environmentResponse
  })

  it('should fetch a Secret Event', async () => {
    secret = (await client.post(
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
    )) as any
    const events = await EventController.getEvents(
      { workspaceId, source: EventSource.SECRET },
      { 'x-e2e-user-email': email }
    )
    console.log(events)
    expect(events[0].source).toBe('SECRET')
    expect(events[0].metadata.secretId).toBe(secret.id)
    expect(events[0].metadata.name).toBe('My secret')
  })

  it('should fetch a Variable Event', async () => {
    variable = (await client.post(
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
    )) as any
    const events = await EventController.getEvents(
      { workspaceId, source: EventSource.VARIABLE },
      { 'x-e2e-user-email': email }
    )
    console.log(events)
    expect(events[0].source).toBe('VARIABLE')
    expect(events[0].metadata.variableId).toBe(variable.id)
    expect(events[0].metadata.name).toBe('My variable')
  })
})
