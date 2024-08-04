import { APIClient } from '../src/core/client'
import IntegrationController from '../src/controllers/integration'

export enum IntegrationType {
  DISCORD = 'DISCORD',
  SLACK = 'SLACK',
  GITHUB = 'GITHUB',
  GITLAB = 'GITLAB'
}

export enum EventType {
  INVITED_TO_WORKSPACE = 'INVITED_TO_WORKSPACE',
  REMOVED_FROM_WORKSPACE = 'REMOVED_FROM_WORKSPACE',
  ACCEPTED_INVITATION = 'ACCEPTED_INVITATION',
  DECLINED_INVITATION = 'DECLINED_INVITATION',
  CANCELLED_INVITATION = 'CANCELLED_INVITATION',
  LEFT_WORKSPACE = 'LEFT_WORKSPACE',
  WORKSPACE_MEMBERSHIP_UPDATED = 'WORKSPACE_MEMBERSHIP_UPDATED',
  WORKSPACE_UPDATED = 'WORKSPACE_UPDATED',
  WORKSPACE_CREATED = 'WORKSPACE_CREATED',
  WORKSPACE_ROLE_CREATED = 'WORKSPACE_ROLE_CREATED',
  WORKSPACE_ROLE_UPDATED = 'WORKSPACE_ROLE_UPDATED',
  WORKSPACE_ROLE_DELETED = 'WORKSPACE_ROLE_DELETED',
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  SECRET_UPDATED = 'SECRET_UPDATED',
  SECRET_DELETED = 'SECRET_DELETED',
  SECRET_ADDED = 'SECRET_ADDED',
  VARIABLE_UPDATED = 'VARIABLE_UPDATED',
  VARIABLE_DELETED = 'VARIABLE_DELETED',
  VARIABLE_ADDED = 'VARIABLE_ADDED',
  ENVIRONMENT_UPDATED = 'ENVIRONMENT_UPDATED',
  ENVIRONMENT_DELETED = 'ENVIRONMENT_DELETED',
  ENVIRONMENT_ADDED = 'ENVIRONMENT_ADDED',
  INTEGRATION_ADDED = 'INTEGRATION_ADDED',
  INTEGRATION_UPDATED = 'INTEGRATION_UPDATED',
  INTEGRATION_DELETED = 'INTEGRATION_DELETED'
}

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
    //Create the user's workspace
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

  it('should create a integration', async () => {
    const integration = await integrationController.createIntegration(
      {
        workspaceId,
        projectId,
        name: 'Discord second',
        type: IntegrationType.DISCORD,
        notifyOn: [EventType.PROJECT_CREATED],
        metadata: {
          webhookUrl: '{{vault:WEBHOOK_URL}}'
        },
        environmentId: environment.id
      },
      {
        'x-e2e-user-email': email
      }
    )
    expect(integration.data?.name).toBe('Discord second')
    expect(integration.data?.projectId).toBe(projectId)
    expect(integration.data?.environmentId).toBe(environment.id)
    expect(integration.data?.workspaceId).toBe(workspaceId)
    expect(integration.data?.type).toBe('DISCORD')
    integrationId = integration.data?.id as string
  })

  it('should update the integration', async () => {
    const updatedIntegration: any =
      await integrationController.updateIntegration(
        { integrationId, name: 'Github second' },
        { 'x-e2e-user-email': email }
      )
    expect(updatedIntegration.data.name).toBe('Github second')
  })

  it('should get a integration', async () => {
    const integration: any = await integrationController.getIntegration(
      { integrationId },
      { 'x-e2e-user-email': email }
    )
    expect(integration).toBeDefined()
  })

  it('should get all the integration in workspace', async () => {
    // adding more integrations
    await integrationController.createIntegration(
      {
        workspaceId,
        projectId,
        name: 'Discord third',
        type: IntegrationType.DISCORD,
        notifyOn: [EventType.PROJECT_CREATED],
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
    expect(integrations.data.items.length).toBe(2)
  })

  it('should delete a integration', async () => {
    await integrationController.deleteIntegration(
      { integrationId },
      { 'x-e2e-user-email': email }
    )
    const integrations: any = await integrationController.getAllIntegrations(
      { workspaceId },
      { 'x-e2e-user-email': email }
    )
    expect(integrations.data.items.length).toBe(1)
  })
})
