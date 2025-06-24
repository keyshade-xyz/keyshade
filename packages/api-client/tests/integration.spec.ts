import { APIClient } from '../src/core/client'
import IntegrationController from '../src/controllers/integration'

describe('Get Environments Tests', () => {
  const backendUrl = process.env.BACKEND_URL as string

  const client = new APIClient(backendUrl)
  const integrationController = new IntegrationController(backendUrl)
  const email = 'johndoe@example.com'
  let projectSlug: string | undefined
  let workspaceSlug: string
  let environment: any
  let integrationSlug: string

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

    environment = createEnvironmentResponse
  })

  afterAll(async () => {
    // Delete the workspace
    await client.delete(`/api/workspace/${workspaceSlug}`, {
      'x-e2e-user-email': email
    })
  })

  beforeEach(async () => {
    // Create a dummy integration before each test
    const integration = await integrationController.createIntegration(
      {
        workspaceSlug,
        projectSlug,
        name: 'Dummy Integration',
        type: 'DISCORD',
        notifyOn: ['PROJECT_CREATED'],
        metadata: {
          webhookUrl: '{{vault:WEBHOOK_URL}}'
        },
        environmentSlugs: environment.slug
      },
      {
        'x-e2e-user-email': email
      }
    )
    integrationSlug = integration.data?.slug as string
  })

  afterEach(async () => {
    // Delete the dummy integration after each test
    await integrationController.deleteIntegration(
      { integrationSlug },
      { 'x-e2e-user-email': email }
    )
  })

  it('should create an integration', async () => {
    const integration = await integrationController.createIntegration(
      {
        workspaceSlug,
        projectSlug,
        name: 'Discord second',
        type: 'DISCORD',
        notifyOn: ['PROJECT_CREATED'],
        metadata: {
          webhookUrl: '{{vault:WEBHOOK_URL}}'
        },
        environmentSlugs: environment.slug
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(integration.data.name).toBe('Discord second')
    expect(integration.data.type).toBe('DISCORD')
  })

  it('should update the integration', async () => {
    const updatedIntegration: any =
      await integrationController.updateIntegration(
        { integrationSlug, name: 'Github second' },
        { 'x-e2e-user-email': email }
      )
    expect(updatedIntegration.data.name).toBe('Github second')

    // Delete the integration
    await integrationController.deleteIntegration(
      { integrationSlug: updatedIntegration.data.slug },
      { 'x-e2e-user-email': email }
    )
  })

  it('should get an integration', async () => {
    const integration: any = await integrationController.getIntegration(
      { integrationSlug },
      { 'x-e2e-user-email': email }
    )
    expect(integration).toBeDefined()
  })

  it('should get all integrations in workspace', async () => {
    // Adding another integration
    await integrationController.createIntegration(
      {
        workspaceSlug,
        projectSlug,
        name: 'Discord third',
        type: 'DISCORD',
        notifyOn: ['PROJECT_CREATED'],
        metadata: {
          webhookUrl: '{{vault:WEBHOOK_URL}}'
        },
        environmentSlugs: environment.slug
      },
      {
        'x-e2e-user-email': email
      }
    )
    const integrations: any = await integrationController.getAllIntegrations(
      { workspaceSlug },
      { 'x-e2e-user-email': email }
    )
    expect(integrations.data?.items.length).toBe(3)
  })

  it('should delete an integration', async () => {
    await integrationController.deleteIntegration(
      { integrationSlug },
      { 'x-e2e-user-email': email }
    )
    const integrations: any = await integrationController.getAllIntegrations(
      { workspaceSlug },
      { 'x-e2e-user-email': email }
    )
    expect(integrations.data.items.length).toBe(2)
  })
})
