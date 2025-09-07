import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { PrismaService } from '@/prisma/prisma.service'
import { UserService } from '@/user/user.service'
import { IntegrationService } from './integration.service'
import { WorkspaceService } from '@/workspace/workspace.service'
import { Test } from '@nestjs/testing'
import { UserModule } from '@/user/user.module'
import { WorkspaceModule } from '@/workspace/workspace.module'
import { IntegrationModule } from './integration.module'
import { AppModule } from '@/app/app.module'
import {
  Environment,
  EventType,
  Integration,
  IntegrationRunStatus,
  IntegrationType,
  Project,
  Workspace
} from '@prisma/client'
import { ProjectService } from '@/project/project.service'
import { ProjectModule } from '@/project/project.module'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
import { EnvironmentModule } from '@/environment/environment.module'
import { EnvironmentService } from '@/environment/environment.service'
import { QueryTransformPipe } from '@/common/pipes/query.transform.pipe'
import { AuthenticatedUser, UserWithWorkspace } from '@/user/user.types'
import { CreateIntegration } from './dto/create.integration/create.integration'
import { mockClient } from 'aws-sdk-client-mock'
import {
  GetFunctionConfigurationCommand,
  LambdaClient
} from '@aws-sdk/client-lambda'
import { SlackIntegrationMetadata } from './integration.types'
import nock = require('nock')

const originalFetch = global.fetch
// helper to create dynamic mock responses
function createMockResponse(status: number, body: any): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () =>
      Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    json: () => Promise.resolve(body)
  } as unknown as Response
}

global.fetch = jest
  .fn()
  .mockImplementation((url: string, options?: RequestInit) => {
    // Mock webhook URLs dynamically
    if (url.includes('dummy-webhook-url.com')) {
      const mockStatus = (options?.headers as any)?.['x-mock-status']

      if (mockStatus) {
        const status = Number(mockStatus)
        const body = { success: status >= 200 && status < 300 }
        return Promise.resolve(createMockResponse(status, body))
      }

      // No `x-mock-status`: let nock (or real fetch) handle it
      if (originalFetch) {
        return originalFetch(url, options)
      }
    }

    // Pass through everything else
    if (originalFetch) {
      return originalFetch(url, options)
    }

    throw new Error(`Unmocked fetch call to: ${url}`)
  })

jest.mock('@vercel/sdk', () => {
  const getEnvMock = jest.fn()
  return {
    Vercel: jest.fn().mockImplementation(() => ({
      environment: { getV9ProjectsIdOrNameCustomEnvironments: getEnvMock }
    })),
    __getEnvMock: getEnvMock
  }
})

const postMsgMock = jest.fn()
jest.mock('@slack/bolt', () => {
  return {
    App: jest.fn().mockImplementation(() => ({
      client: { chat: { postMessage: postMsgMock } }
    }))
  }
})

describe('Integration Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let userService: UserService
  let integrationService: IntegrationService
  let workspaceService: WorkspaceService
  let projectService: ProjectService
  let environmentService: EnvironmentService

  let user1: AuthenticatedUser, user2: AuthenticatedUser
  let workspace1: Workspace, workspace2: Workspace
  let project1: Project, project2: Project
  let environment1: Environment, environment2: Environment
  let createDiscordIntegration: () => Promise<Integration>
  let getEnvMock: jest.Mock

  const USER_IP_ADDRESS = '127.0.0.1'
  const DUMMY_WEBHOOK_URL = 'https://dummy-webhook-url.com'

  const createDummyDiscordWebhookUrlInterceptor = () => {
    const { origin, pathname } = new URL(DUMMY_WEBHOOK_URL)
    nock(origin)
      .persist()
      .get(pathname || '/')
      .reply(200)

    nock(origin)
      .persist()
      .post(pathname || '/')
      .reply(200, { success: true })

    nock(origin)
      .persist()
      .post(pathname || '/')
      .reply(400, { error: 'Bad Request' })

    nock(origin)
      .persist()
      .post(pathname || '/')
      .reply(401, { error: 'Unauthorized' })

    nock(origin)
      .persist()
      .post(pathname || '/')
      .reply(403, { error: 'Forbidden' })

    nock(origin)
      .persist()
      .post(pathname || '/')
      .reply(404, { error: 'Not Found' })

    nock(origin)
      .persist()
      .post(pathname || '/')
      .reply(409, { error: 'Conflict' })

    nock(origin)
      .persist()
      .post(pathname || '/')
      .reply(429, { error: 'Too Many Requests' })

    nock(origin)
      .persist()
      .post(pathname || '/')
      .reply(500, { error: 'Internal Server Error' })
  }

  const DUMMY_INTEGRATION_NAME = 'Integration 1'

  beforeAll(async () => {
    const sdkMock = jest.requireMock('@vercel/sdk') as {
      __getEnvMock: jest.Mock
    }
    getEnvMock = sdkMock.__getEnvMock

    nock.disableNetConnect()
    nock.enableNetConnect('127.0.0.1')

    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        UserModule,
        WorkspaceModule,
        IntegrationModule,
        ProjectModule,
        EnvironmentModule
      ]
    })
      .overrideProvider(MAIL_SERVICE)
      .useClass(MockMailService)
      .compile()
    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    )
    prisma = moduleRef.get(PrismaService)
    userService = moduleRef.get(UserService)
    integrationService = moduleRef.get(IntegrationService)
    workspaceService = moduleRef.get(WorkspaceService)
    projectService = moduleRef.get(ProjectService)
    environmentService = moduleRef.get(EnvironmentService)

    app.useGlobalPipes(new QueryTransformPipe())

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  beforeEach(async () => {
    const createUser1 = (await userService.createUser({
      email: 'john@keyshade.xyz',
      name: 'John',
      isActive: true,
      isAdmin: false,
      isOnboardingFinished: true
    })) as UserWithWorkspace

    const createUser2 = (await userService.createUser({
      email: 'jane@keyshade.xyz',
      name: 'Jane',
      isActive: true,
      isAdmin: false,
      isOnboardingFinished: true
    })) as UserWithWorkspace

    workspace1 = createUser1.defaultWorkspace
    workspace2 = createUser2.defaultWorkspace

    delete createUser1.defaultWorkspace
    delete createUser2.defaultWorkspace

    user1 = {
      ...createUser1,
      ipAddress: USER_IP_ADDRESS
    }
    user2 = {
      ...createUser2,
      ipAddress: USER_IP_ADDRESS
    }

    project1 = await projectService.createProject(user1, workspace1.slug, {
      name: 'Project 1',
      description: 'Description 1'
    })

    project2 = await projectService.createProject(user2, workspace2.slug, {
      name: 'Project 2',
      description: 'Description 2'
    })

    environment1 = await environmentService.createEnvironment(
      user1,
      {
        name: 'Environment 1',
        description: 'Description 1'
      },
      project1.slug
    )

    environment2 = await environmentService.createEnvironment(
      user2,
      {
        name: 'Environment 2',
        description: 'Description 2'
      },
      project2.slug
    )

    createDiscordIntegration = async () => {
      return await integrationService.createIntegration(
        user1,
        {
          name: DUMMY_INTEGRATION_NAME,
          type: IntegrationType.DISCORD,
          metadata: {
            webhookUrl: DUMMY_WEBHOOK_URL
          },
          notifyOn: [EventType.WORKSPACE_UPDATED],
          privateKey: 'abc'
        },
        workspace1.slug
      )
    }
  })

  afterEach(async () => {
    // Delete the users
    await prisma.user.deleteMany()
    // Delete the workspaces
    await prisma.workspace.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
    await app.close()

    nock.enableNetConnect()
    nock.cleanAll()
  })

  it('should be defined', () => {
    expect(app).toBeDefined()
    expect(prisma).toBeDefined()
    expect(userService).toBeDefined()
    expect(integrationService).toBeDefined()
    expect(workspaceService).toBeDefined()
    expect(projectService).toBeDefined()
  })

  describe('Create Integration Tests', () => {
    it('should not be able to create an integration in the workspace with the same name', async () => {
      createDummyDiscordWebhookUrlInterceptor()
      await createDiscordIntegration()

      const result = await app.inject({
        method: 'POST',
        url: `/integration/${workspace1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: {
          name: DUMMY_INTEGRATION_NAME,
          type: IntegrationType.DISCORD,
          metadata: {
            webhookUrl: DUMMY_WEBHOOK_URL
          },
          notifyOn: [EventType.WORKSPACE_UPDATED]
        }
      })

      expect(result.statusCode).toEqual(409)
    })

    it('should not be able to create an integration in a workspace that does not exist', async () => {
      const result = await app.inject({
        method: 'POST',
        url: `/integration/999999`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: {
          name: 'Integration 2',
          type: IntegrationType.DISCORD,
          metadata: {
            webhookUrl: DUMMY_WEBHOOK_URL
          },
          notifyOn: [EventType.WORKSPACE_UPDATED]
        }
      })

      expect(result.statusCode).toEqual(404)
    })

    it('should not be able to create an integration in a workspace in which the user is not a member', async () => {
      const result = await app.inject({
        method: 'POST',
        url: `/integration/${workspace2.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: {
          name: 'Integration 2',
          type: IntegrationType.DISCORD,
          metadata: {
            webhookUrl: DUMMY_WEBHOOK_URL
          },
          notifyOn: [EventType.WORKSPACE_UPDATED]
        }
      })

      expect(result.statusCode).toEqual(401)
    })

    it('should not be able to create an integration for a project the user does not have access to', async () => {
      const result = await app.inject({
        method: 'POST',
        url: `/integration/${workspace1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        },
        payload: {
          name: 'Integration 2',
          type: IntegrationType.DISCORD,
          metadata: {
            webhookUrl: DUMMY_WEBHOOK_URL
          },
          notifyOn: [EventType.WORKSPACE_UPDATED],
          projectSlug: project1.slug
        }
      })

      expect(result.statusCode).toEqual(401)
    })

    it('should not be able to create an integration in a project that does not exist', async () => {
      const result = await app.inject({
        method: 'POST',
        url: `/integration/${workspace1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: {
          name: 'Integration 2',
          type: IntegrationType.DISCORD,
          metadata: {
            webhookUrl: DUMMY_WEBHOOK_URL
          },
          notifyOn: [EventType.WORKSPACE_UPDATED],
          projectSlug: '999999'
        }
      })

      expect(result.statusCode).toEqual(404)
    })

    it('should throw an error if environment slug is specified and not project slug', async () => {
      const result = await app.inject({
        method: 'POST',
        url: `/integration/${workspace1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: {
          name: 'Integration 2',
          type: IntegrationType.DISCORD,
          metadata: {
            webhookUrl: DUMMY_WEBHOOK_URL
          },
          notifyOn: [EventType.WORKSPACE_UPDATED],
          environmentSlugs: ['123']
        }
      })

      expect(result.statusCode).toEqual(400)
    })

    it('should not be able to create an integration for an environment the user does not have access to', async () => {
      const result = await app.inject({
        method: 'POST',
        url: `/integration/${workspace1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: {
          name: 'Integration 2',
          type: IntegrationType.DISCORD,
          metadata: {
            webhookUrl: DUMMY_WEBHOOK_URL
          },
          notifyOn: [EventType.WORKSPACE_UPDATED],
          environmentSlugs: [environment2.slug],
          projectSlug: project1.slug
        }
      })

      expect(result.statusCode).toEqual(401)
    })

    it('should not be able to create an integration in an environment that does not exist', async () => {
      const result = await app.inject({
        method: 'POST',
        url: `/integration/${workspace1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: {
          name: 'Integration 2',
          type: IntegrationType.DISCORD,
          metadata: {
            webhookUrl: DUMMY_WEBHOOK_URL
          },
          notifyOn: [EventType.WORKSPACE_UPDATED],
          environmentSlugs: ['999999'],
          projectSlug: project1.slug
        }
      })

      expect(result.statusCode).toEqual(404)
    })

    it('should be able to create an integration without any project or environment slug', async () => {
      createDummyDiscordWebhookUrlInterceptor()

      const result = await app.inject({
        method: 'POST',
        url: `/integration/${workspace1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: {
          name: 'Integration 2',
          type: IntegrationType.DISCORD,
          metadata: {
            webhookUrl: DUMMY_WEBHOOK_URL
          },
          notifyOn: [EventType.WORKSPACE_UPDATED]
        }
      })

      expect(result.statusCode).toEqual(201)
      expect(result.json().name).toEqual('Integration 2')
      expect(result.json().type).toEqual(IntegrationType.DISCORD)
      expect(result.json().id).toBeDefined()

      const integration = await prisma.integration.findUnique({
        where: {
          id: result.json().id
        }
      })
      expect(integration).toBeDefined()
      expect(integration!.id).toEqual(result.json().id)
    })
  })

  describe('Discord Integration Initialization Tests', () => {
    const validDto: CreateIntegration = {
      name: 'Discord Init Test',
      type: IntegrationType.DISCORD,
      metadata: { webhookUrl: DUMMY_WEBHOOK_URL },
      notifyOn: [EventType.WORKSPACE_UPDATED]
    }

    it('should send initialization message when Discord integration is created', async () => {
      createDummyDiscordWebhookUrlInterceptor()

      const result = await app.inject({
        method: 'POST',
        url: `/integration/${workspace1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: validDto
      })

      expect(result.statusCode).toEqual(201)

      const integrationRuns = await prisma.integrationRun.findMany({
        where: {
          integrationId: result.json().id,
          title: 'Initializing Discord integration'
        }
      })

      expect(integrationRuns).toHaveLength(1)
      expect(integrationRuns[0].status).toBe(IntegrationRunStatus.SUCCESS)
    })
  })

  describe('Slack Integration Initialization Tests', () => {
    const DUMMY_TOKEN = 'xoxb-valid-but-test'
    const DUMMY_SIGNING_SECRET = 'fake-signing-secret'
    const DUMMY_CHANNEL = 'C1234567890'

    const validDtoSlack: CreateIntegration = {
      name: 'Validation Test',
      type: IntegrationType.SLACK,
      metadata: {
        botToken: DUMMY_TOKEN,
        signingSecret: DUMMY_SIGNING_SECRET,
        channelId: DUMMY_CHANNEL
      } satisfies SlackIntegrationMetadata,
      notifyOn: [EventType.WORKSPACE_UPDATED]
    }

    it('should send initialization message when Slack integration is created', async () => {
      nock('https://slack.com').post('/api/auth.test').reply(200, {
        ok: true
      })

      nock('https://slack.com')
        .post('/api/chat.postEphemeral')
        .reply(200, { ok: true })

      nock('https://slack.com').post('/api/chat.postMessage').reply(200, {
        ok: true
      })

      postMsgMock.mockResolvedValueOnce({
        ok: true,
        message: { text: 'Posting message to Slack' }
      })

      const result = await app.inject({
        method: 'POST',
        url: `/integration/${workspace1.slug}`,
        headers: { 'x-e2e-user-email': user1.email },
        payload: validDtoSlack
      })

      expect(result.statusCode).toEqual(201)

      const integrationRuns = await prisma.integrationRun.findMany({
        where: {
          integrationId: result.json().id,
          title: 'Posting message to Slack'
        }
      })

      expect(integrationRuns).toHaveLength(1)
      expect(integrationRuns[0].status).toBe(IntegrationRunStatus.SUCCESS)
    })
  })

  describe('Update Integration Tests', () => {
    let integration1: Integration

    beforeEach(async () => {
      createDummyDiscordWebhookUrlInterceptor()
      integration1 = await createDiscordIntegration()
    })

    it('should not be able to update an integration if it does not exist', async () => {
      const result = await app.inject({
        method: 'PUT',
        url: `/integration/999999`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: {
          name: 'Integration 2'
        }
      })

      expect(result.statusCode).toEqual(404)
    })

    it('should not be able to update an integration if the user does not have access to it', async () => {
      const result = await app.inject({
        method: 'PUT',
        url: `/integration/${integration1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        },
        payload: {
          name: 'Integration 2'
        }
      })

      expect(result.statusCode).toEqual(401)
    })

    it('should not be able to update the name to an existing name', async () => {
      const result = await app.inject({
        method: 'PUT',
        url: `/integration/${integration1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: {
          name: 'Integration 1'
        }
      })

      expect(result.statusCode).toEqual(409)
    })

    it('should fail to update if the environment slug is specified and not the project slug', async () => {
      // Update the integration
      const result = await app.inject({
        method: 'PUT',
        url: `/integration/${integration1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: {
          environmentSlugs: [environment1.slug]
        }
      })

      expect(result.statusCode).toEqual(400)
    })

    it('should not fail to update if the integration has project present and only environmentSlugs is updated', async () => {
      createDummyDiscordWebhookUrlInterceptor()

      // Create the integration
      const integration = await integrationService.createIntegration(
        user1,
        {
          name: 'Integration 2',
          type: IntegrationType.DISCORD,
          metadata: {
            webhookUrl: DUMMY_WEBHOOK_URL
          },
          notifyOn: [EventType.WORKSPACE_UPDATED],
          projectSlug: project1.slug,
          privateKey: 'abc'
        },
        workspace1.slug
      )

      // Update the integration
      const result = await app.inject({
        method: 'PUT',
        url: `/integration/${integration.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: {
          environmentSlugs: [environment1.slug]
        }
      })

      expect(result.statusCode).toEqual(200)

      const updatedIntegration = await prisma.integration.findUnique({
        where: {
          id: integration.id
        }
      })

      expect(updatedIntegration).toBeDefined()
    })

    it('should fail to update if the user does not have access to the environment', async () => {
      await prisma.integration.update({
        where: {
          id: integration1.id
        },
        data: {
          projectId: project1.id
        }
      })

      // Update the integration
      const result = await app.inject({
        method: 'PUT',
        url: `/integration/${integration1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: {
          environmentSlugs: [environment2.slug]
        }
      })

      expect(result.statusCode).toEqual(401)
    })

    it('should fail to update if the environment does not exist', async () => {
      await prisma.integration.update({
        where: {
          id: integration1.id
        },
        data: {
          projectId: project1.id
        }
      })

      // Update the integration
      const result = await app.inject({
        method: 'PUT',
        url: `/integration/${integration1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: {
          environmentSlugs: ['999999']
        }
      })

      expect(result.statusCode).toEqual(404)
    })

    it('should be able to update the integration', async () => {
      createDummyDiscordWebhookUrlInterceptor()

      // Update the integration
      const result = await app.inject({
        method: 'PUT',
        url: `/integration/${integration1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: {
          name: 'Integration 2'
        }
      })

      expect(result.statusCode).toEqual(200)

      const updatedIntegration = await prisma.integration.findUnique({
        where: {
          id: integration1.id
        }
      })

      expect(updatedIntegration).toBeDefined()
      expect(updatedIntegration.name).toEqual('Integration 2')
      expect(updatedIntegration.slug).not.toEqual(integration1.slug)
    })
  })

  describe('Get Integration Tests', () => {
    let integration1: Integration

    beforeEach(async () => {
      createDummyDiscordWebhookUrlInterceptor()
      integration1 = await createDiscordIntegration()
    })

    it('should be able to fetch an integration', async () => {
      const result = await app.inject({
        method: 'GET',
        url: `/integration/${integration1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(result.statusCode).toEqual(200)
      expect(result.json().id).toEqual(integration1.id)
    })

    it('should not be able to fetch an integration that does not exist', async () => {
      const result = await app.inject({
        method: 'GET',
        url: `/integration/999999`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(result.statusCode).toEqual(404)
    })

    it('should not be able to fetch an integration if the user does not have access to it', async () => {
      const result = await app.inject({
        method: 'GET',
        url: `/integration/${integration1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(result.statusCode).toEqual(401)
    })

    it('should be able to fetch all integrations on first page', async () => {
      const result = await app.inject({
        method: 'GET',
        url: `/integration/all/${workspace1.slug}?page=0&limit=10`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(result.statusCode).toEqual(200)
      expect(result.json().items).toHaveLength(1)

      //check metadata
      const metadata = result.json().metadata
      expect(metadata.totalCount).toEqual(1)
      expect(metadata.links.self).toEqual(
        `/integration/all/${workspace1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.first).toEqual(
        `/integration/all/${workspace1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.previous).toBeNull()
      expect(metadata.links.next).toBeNull()
      expect(metadata.links.last).toEqual(
        `/integration/all/${workspace1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
    })
  })

  describe('Validate Config (metadata-only) Tests', () => {
    const endpoint = '/integration/validate-config'
    const validDto: CreateIntegration = {
      name: 'Validation Test',
      type: IntegrationType.DISCORD,
      metadata: { webhookUrl: DUMMY_WEBHOOK_URL },
      notifyOn: [EventType.WORKSPACE_UPDATED]
    }

    let existingIntegration: Integration

    afterEach(() => {
      nock.cleanAll()
    })

    it('should succeed validating metadata on create when DTO is valid', async () => {
      createDummyDiscordWebhookUrlInterceptor()

      const response = await app.inject({
        method: 'POST',
        url: `${endpoint}?isCreate=true`,
        headers: { 'x-e2e-user-email': user1.email },
        payload: validDto
      })

      expect(response.statusCode).toEqual(200)
      expect(response.json()).toEqual({ success: true })
    })

    it('should succeed validating metadata on update when DTO is valid', async () => {
      createDummyDiscordWebhookUrlInterceptor()

      existingIntegration = await integrationService.createIntegration(
        user1,
        {
          ...validDto,
          privateKey: 'abc'
        },
        workspace1.slug
      )

      createDummyDiscordWebhookUrlInterceptor()

      const response = await app.inject({
        method: 'POST',
        url: `${endpoint}?isCreate=false&integrationSlug=${existingIntegration.slug}`,
        headers: { 'x-e2e-user-email': user1.email },
        payload: {
          metadata: validDto.metadata,
          notifyOn: validDto.notifyOn
        }
      })

      expect(response.statusCode).toEqual(200)
      expect(response.json()).toEqual({ success: true })
    })

    it('should return 500 if integrationSlug is missing on update', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `${endpoint}?isCreate=false`,
        headers: { 'x-e2e-user-email': user1.email },
        payload: validDto
      })

      expect(response.statusCode).toEqual(500)
      expect(response.json().message).toContain(
        'Uh-oh, something went wront on our end'
      )
    })

    it('should return 401 if user is not authorized to update that integration', async () => {
      createDummyDiscordWebhookUrlInterceptor()

      existingIntegration = await integrationService.createIntegration(
        user1,
        {
          ...validDto,
          privateKey: 'abc'
        },
        workspace1.slug
      )

      createDummyDiscordWebhookUrlInterceptor()

      const response = await app.inject({
        method: 'POST',
        url: `${endpoint}?isCreate=false&integrationSlug=${existingIntegration.slug}`,
        headers: { 'x-e2e-user-email': user2.email },
        payload: {
          metadata: validDto.metadata,
          notifyOn: validDto.notifyOn
        }
      })

      expect(response.statusCode).toEqual(401)
    })

    it('should return 400 if notifyOn contains an event the integration does not permit', async () => {
      createDummyDiscordWebhookUrlInterceptor()

      const badDto = {
        ...validDto,
        notifyOn: ['A-NOT-PERMITTED-EVENT']
      }
      const response = await app.inject({
        method: 'POST',
        url: `${endpoint}?isCreate=true`,
        headers: { 'x-e2e-user-email': user1.email },
        payload: badDto
      })

      expect(response.statusCode).toEqual(400)
      expect(response.json().message).toMatch(
        /Event not supported by integration/
      )
    })

    it('should return 400 if metadata params fail validation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `${endpoint}?isCreate=true`,
        headers: { 'x-e2e-user-email': user1.email },
        payload: {
          ...validDto,
          metadata: {}
        }
      })

      expect(response.statusCode).toEqual(400)
      expect(response.json().message).toMatch(/Missing metadata parameter/)
    })

    describe('Discord configuration tests', () => {
      it('should fail validating metadata on create if webhook URL is unreachable', async () => {
        const { origin, pathname } = new URL(DUMMY_WEBHOOK_URL)

        nock(origin)
          .get(pathname || '/')
          .reply(404)

        const response = await app.inject({
          method: 'POST',
          url: `${endpoint}?isCreate=true`,
          headers: { 'x-e2e-user-email': user1.email, 'x-mock-status': 404 },
          payload: validDto
        })

        expect(response.statusCode).toEqual(400)
      })
    })

    describe('Slack configuration tests', () => {
      const DUMMY_TOKEN = 'xoxb-valid-but-test'
      const DUMMY_SIGNING_SECRET = 'fake-signing-secret'
      const DUMMY_CHANNEL = 'C1234567890'

      const validDtoSlack: CreateIntegration = {
        name: 'Validation Test',
        type: IntegrationType.SLACK,
        metadata: {
          botToken: DUMMY_TOKEN,
          signingSecret: DUMMY_SIGNING_SECRET,
          channelId: DUMMY_CHANNEL
        } satisfies SlackIntegrationMetadata,
        notifyOn: [EventType.WORKSPACE_UPDATED]
      }

      it('should fail when token is invalid', async () => {
        nock('https://slack.com')
          .post('/api/auth.test')
          .reply(200, { ok: false, error: 'invalid_auth' })

        const result = await app.inject({
          method: 'POST',
          url: `${endpoint}?isCreate=true`,
          payload: validDtoSlack,
          headers: { 'x-e2e-user-email': user1.email }
        })

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(await result.json().message)).toEqual(
          expect.objectContaining({
            header: 'Slack token validation failed',
            body: 'invalid_auth'
          })
        )
      })

      it('should fail when channel is invalid', async () => {
        nock('https://slack.com').post('/api/auth.test').reply(200, {
          ok: true
        })

        nock('https://slack.com')
          .post('/api/chat.postEphemeral')
          .reply(200, { ok: false, error: 'channel_not_found' })

        const result = await app.inject({
          method: 'POST',
          url: `${endpoint}?isCreate=true`,
          payload: validDtoSlack,
          headers: { 'x-e2e-user-email': user1.email }
        })

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(await result.json().message)).toEqual(
          expect.objectContaining({
            header: 'Slack write validation failed',
            body: 'channel_not_found'
          })
        )
      })

      it('should succeed when token and write-permission are valid', async () => {
        nock('https://slack.com').post('/api/auth.test').reply(200, {
          ok: true
        })

        nock('https://slack.com')
          .post('/api/chat.postEphemeral')
          .reply(200, { ok: true })

        const result = await app.inject({
          method: 'POST',
          url: `${endpoint}?isCreate=true`,
          payload: validDtoSlack,
          headers: { 'x-e2e-user-email': user1.email }
        })

        expect(result.statusCode).toBe(200)
        expect(await result.json()).toEqual(
          expect.objectContaining({
            success: true
          })
        )
      })
    })

    describe('Vercel configuration tests', () => {
      const validDtoVercel: CreateIntegration = {
        name: 'Validation Test',
        type: IntegrationType.VERCEL,
        metadata: {
          token: 'fake-vercel-token',
          projectId: 'dummy-project-id',
          environments: {
            production: { vercelSystemEnvironment: 'production' },
            preview: { vercelSystemEnvironment: 'preview' }
          }
        },
        notifyOn: [EventType.SECRET_ADDED]
      }

      it('should fail validating metadata on create if Vercel API is unreachable', async () => {
        getEnvMock.mockRejectedValueOnce(new Error('Network unreachable'))

        const response = await app.inject({
          method: 'POST',
          url: `${endpoint}?isCreate=true`,
          headers: { 'x-e2e-user-email': user1.email },
          payload: validDtoVercel
        })

        expect(response.statusCode).toEqual(400)
      })

      it('should fail validating metadata on create if custom environment ID is invalid', async () => {
        getEnvMock.mockResolvedValueOnce({
          response: {
            environments: [{ id: 'some-other-id', name: 'staging' }]
          },
          duration: 5
        })

        const response = await app.inject({
          method: 'POST',
          url: `${endpoint}?isCreate=true`,
          headers: { 'x-e2e-user-email': user1.email },
          payload: validDtoVercel
        })

        expect(response.statusCode).toEqual(400)
      })
    })

    describe('AWS Lambda configuration tests', () => {
      const lambdaMock = mockClient(LambdaClient)

      const validDtoLambda: CreateIntegration = {
        name: 'AWS Lambda Test',
        type: IntegrationType.AWS_LAMBDA,
        metadata: {
          lambdaFunctionName: 'my-function',
          region: 'us-east-1',
          accessKeyId: 'AKIA_FAKE',
          secretAccessKey: 'SECRET_FAKE'
        },
        notifyOn: [EventType.SECRET_ADDED],
        environmentSlugs: ['prod'],
        projectSlug: 'test-project',
        privateKey: 'fake-key'
      }

      beforeEach(() => {
        lambdaMock.reset()
      })

      it('should return 400 if the Lambda function does not exist', async () => {
        lambdaMock.on(GetFunctionConfigurationCommand).rejects({
          name: 'ResourceNotFoundException',
          message: 'Function not found'
        })

        const response = await app.inject({
          method: 'POST',
          url: `${endpoint}?isCreate=true`,
          headers: { 'x-e2e-user-email': user1.email },
          payload: validDtoLambda
        })

        expect(response.statusCode).toEqual(400)
      })

      it('should return 400 if credentials are invalid', async () => {
        lambdaMock.on(GetFunctionConfigurationCommand).rejects({
          name: 'UnrecognizedClientException',
          message: 'Invalid signature'
        })

        const response = await app.inject({
          method: 'POST',
          url: `${endpoint}?isCreate=true`,
          headers: { 'x-e2e-user-email': user1.email },
          payload: validDtoLambda
        })

        expect(response.statusCode).toEqual(400)
      })

      it('should create the integration when validation succeeds', async () => {
        lambdaMock.on(GetFunctionConfigurationCommand).resolves({
          FunctionName: 'my-function',
          Runtime: 'nodejs22.x',
          Environment: { Variables: {} }
        })

        const response = await app.inject({
          method: 'POST',
          url: `${endpoint}?isCreate=true`,
          headers: { 'x-e2e-user-email': user1.email },
          payload: validDtoLambda
        })

        expect(response.statusCode).toEqual(200)
      })
    })
  })

  describe('Delete Integration Tests', () => {
    let integration1: Integration

    beforeEach(async () => {
      createDummyDiscordWebhookUrlInterceptor()
      integration1 = await createDiscordIntegration()
    })

    it('should be able to delete an integration', async () => {
      const result = await app.inject({
        method: 'DELETE',
        url: `/integration/${integration1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(result.statusCode).toEqual(200)

      const deletedIntegration = await prisma.integration.findUnique({
        where: {
          id: integration1.id
        }
      })

      expect(deletedIntegration).toBeNull()
    })

    it('should not be able to delete an integration that does not exist', async () => {
      const result = await app.inject({
        method: 'DELETE',
        url: `/integration/999999`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(result.statusCode).toEqual(404)
    })
  })
})
