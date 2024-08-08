import { APIClient } from '../src/core/client'
import IntegrationController from '../src/controllers/integration'

describe('Get Environments Tests', () => {
  const backendUrl = process.env.BACKEND_URL as string

  const client = new APIClient(backendUrl)
  const integrationController = new IntegrationController(backendUrl)
  const email = 'johndoe@example.com'
  let projectId: string | undefined
  let workspaceId: string
  let environment: any
  let integrationId: string

  beforeAll(async () => {
    // Create the user's workspace
    const workspaceResponse = (await (
      await client.post(
        '/api/workspace',
        {
          name: 'Integration Workspace'
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

    environment = createEnvironmentResponse
  })

  afterAll(async () => {
    // Delete the workspace
    await client.delete(`/api/workspace/${workspaceId}`, {
      'x-e2e-user-email': email
    })
  })

  beforeEach(async () => {
    // Create a dummy integration before each test
    const integration = await integrationController.createIntegration(
      {
        workspaceId,
        projectId,
        name: 'Dummy Integration',
        type: 'DISCORD',
        notifyOn: ['PROJECT_CREATED'],
        metadata: {
          webhookUrl: '{{vault:WEBHOOK_URL}}'
        },
        environmentId: environment.id
      },
      {
        'x-e2e-user-email': email
      }
    )
    integrationId = integration.data?.id as string
  })

  afterEach(async () => {
    // Delete the dummy integration after each test
    await integrationController.deleteIntegration(
      { integrationId },
      { 'x-e2e-user-email': email }
    )
  })

  it('should create an integration', async () => {
    const integration = await integrationController.createIntegration(
      {
        workspaceId,
        projectId,
        name: 'Discord second',
        type: 'DISCORD',
        notifyOn: ['PROJECT_CREATED'],
        metadata: {
          webhookUrl: '{{vault:WEBHOOK_URL}}'
        },
        environmentId: environment.id
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(integration.data.name).toBe('Discord second')
    expect(integration.data.projectId).toBe(projectId)
    expect(integration.data.environmentId).toBe(environment.id)
    expect(integration.data.workspaceId).toBe(workspaceId)
    expect(integration.data.type).toBe('DISCORD')
  })

  it('should update the integration', async () => {
    const updatedIntegration: any =
      await integrationController.updateIntegration(
        { integrationId, name: 'Github second' },
        { 'x-e2e-user-email': email }
      )
    expect(updatedIntegration.data.name).toBe('Github second')
  })

  it('should get an integration', async () => {
    const integration: any = await integrationController.getIntegration(
      { integrationId },
      { 'x-e2e-user-email': email }
    )
    expect(integration).toBeDefined()
  })

  it('should get all integrations in workspace', async () => {
    // Adding another integration
    await integrationController.createIntegration(
      {
        workspaceId,
        projectId,
        name: 'Discord third',
        type: 'DISCORD',
        notifyOn: ['PROJECT_CREATED'],
        metadata: {
          webhookUrl: '{{vault:WEBHOOK_URL}}'
        },
        environmentId: environment.id
      },
      {
        'x-e2e-user-email': email
      }
    )
    const integrations: any = await integrationController.getAllIntegrations(
      { workspaceId },
      { 'x-e2e-user-email': email }
    )
    expect(integrations.data?.items.length).toBe(3)
  })

  it('should delete an integration', async () => {
    await integrationController.deleteIntegration(
      { integrationId },
      { 'x-e2e-user-email': email }
    )
    const integrations: any = await integrationController.getAllIntegrations(
      { workspaceId },
      { 'x-e2e-user-email': email }
    )
    expect(integrations.data.items.length).toBe(2)
  })
})
