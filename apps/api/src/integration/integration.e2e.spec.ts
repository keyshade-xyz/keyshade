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
import nock = require('nock')
import { CreateIntegration } from './dto/create.integration/create.integration'
import { mockClient } from 'aws-sdk-client-mock'
import {
  LambdaClient,
  GetFunctionConfigurationCommand
} from '@aws-sdk/client-lambda'

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
  let integration1: Integration
  let project1: Project, project2: Project
  let environment1: Environment, environment2: Environment

  const USER_IP_ADDRESS = '127.0.0.1'
  const DUMMY_WEBHOOK_URL = 'https://dummy-webhook-url.com'

  const createDummyWebhookUrlInterceptor = () => {
    const { origin, pathname } = new URL(DUMMY_WEBHOOK_URL)
    return nock(origin)
      .post(pathname || '/')
      .reply(200)
  }

  beforeAll(async () => {
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
      ipAddress: USER_IP_ADDRESS,
      emailPreference: {
        id: expect.any(String),
        userId: createUser1.id,
        marketing: true,
        activity: true,
        critical: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      }
    }
    user2 = {
      ...createUser2,
      ipAddress: USER_IP_ADDRESS,
      emailPreference: {
        id: expect.any(String),
        userId: createUser2.id,
        marketing: true,
        activity: true,
        critical: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      }
    }

    createDummyWebhookUrlInterceptor()

    integration1 = await integrationService.createIntegration(
      user1,
      {
        name: 'Integration 1',
        type: IntegrationType.DISCORD,
        metadata: {
          webhookUrl: DUMMY_WEBHOOK_URL
        },
        notifyOn: [EventType.WORKSPACE_UPDATED],
        privateKey: 'abc'
      },
      workspace1.slug
    )

    project1 = (await projectService.createProject(user1, workspace1.slug, {
      name: 'Project 1',
      description: 'Description 1'
    })) as Project

    project2 = (await projectService.createProject(user2, workspace2.slug, {
      name: 'Project 2',
      description: 'Description 2'
    })) as Project

    environment1 = (await environmentService.createEnvironment(
      user1,
      {
        name: 'Environment 1',
        description: 'Description 1'
      },
      project1.slug
    )) as Environment

    environment2 = (await environmentService.createEnvironment(
      user2,
      {
        name: 'Environment 2',
        description: 'Description 2'
      },
      project2.slug
    )) as Environment
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
      const result = await app.inject({
        method: 'POST',
        url: `/integration/${workspace1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        },
        payload: {
          name: 'Integration 1',
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
      createDummyWebhookUrlInterceptor()

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

  describe('Update Integration Tests', () => {
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
      createDummyWebhookUrlInterceptor()

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
      createDummyWebhookUrlInterceptor()

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
      createDummyWebhookUrlInterceptor()

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
      createDummyWebhookUrlInterceptor()

      existingIntegration = await integrationService.createIntegration(
        user1,
        {
          ...validDto,
          privateKey: 'abc'
        },
        workspace1.slug
      )

      createDummyWebhookUrlInterceptor()

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

    it('should return 400 if integrationSlug is missing on update', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `${endpoint}?isCreate=false`,
        headers: { 'x-e2e-user-email': user1.email },
        payload: validDto
      })

      expect(response.statusCode).toEqual(400)
      expect(response.json().message).toContain('integrationSlug is required')
    })

    it('should return 401 if user is not authorized to update that integration', async () => {
      createDummyWebhookUrlInterceptor()

      existingIntegration = await integrationService.createIntegration(
        user1,
        {
          ...validDto,
          privateKey: 'abc'
        },
        workspace1.slug
      )

      createDummyWebhookUrlInterceptor()

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
      createDummyWebhookUrlInterceptor()

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
          .post(pathname || '/')
          .reply(404)

        const response = await app.inject({
          method: 'POST',
          url: `${endpoint}?isCreate=true`,
          headers: { 'x-e2e-user-email': user1.email },
          payload: validDto
        })

        expect(response.statusCode).toEqual(400)
      })
    })

    describe('Slack configuration tests', () => {
      const validDtoSlack: CreateIntegration = {
        name: 'Validation Test',
        type: IntegrationType.SLACK,
        metadata: { webhookUrl: DUMMY_WEBHOOK_URL },
        notifyOn: [EventType.WORKSPACE_UPDATED]
      }

      it('should fail validating metadata on create if webhook URL is unreachable', async () => {
        const { origin, pathname } = new URL(DUMMY_WEBHOOK_URL)

        nock(origin)
          .post(pathname || '/')
          .reply(404)

        const response = await app.inject({
          method: 'POST',
          url: `${endpoint}?isCreate=true`,
          headers: { 'x-e2e-user-email': user1.email },
          payload: validDtoSlack
        })

        expect(response.statusCode).toEqual(400)
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
        nock('https://api.vercel.com')
          .get(
            `/v9/projects/${validDtoVercel.metadata.projectId}/custom-environments`
          )
          .query(true)
          .reply(404)

        const response = await app.inject({
          method: 'POST',
          url: `${endpoint}?isCreate=true`,
          headers: { 'x-e2e-user-email': user1.email },
          payload: validDtoVercel
        })

        expect(nock.isDone()).toBe(true)
        expect(response.statusCode).toEqual(400)
      })

      it('should fail validating metadata on create if custom environment ID is invalid', async () => {
        nock('https://api.vercel.com')
          .get(
            `/v9/projects/${validDtoVercel.metadata.projectId}/custom-environments`
          )
          .query(true)
          .reply(200, {
            environments: [{ id: 'some-other-id', name: 'staging' }]
          })

        const response = await app.inject({
          method: 'POST',
          url: `${endpoint}?isCreate=true`,
          headers: { 'x-e2e-user-email': user1.email },
          payload: validDtoVercel
        })

        expect(nock.isDone()).toBe(true)
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
