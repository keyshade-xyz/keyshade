import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { PrismaService } from '@/prisma/prisma.service'
import { UserService } from '@/user/service/user.service'
import { IntegrationService } from './service/integration.service'
import { WorkspaceService } from '@/workspace/service/workspace.service'
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
  User,
  Workspace
} from '@prisma/client'
import { ProjectService } from '@/project/service/project.service'
import { ProjectModule } from '@/project/project.module'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
import { EnvironmentModule } from '@/environment/environment.module'
import { EnvironmentService } from '@/environment/service/environment.service'
import { QueryTransformPipe } from '@/common/query.transform.pipe'

describe('Integration Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let userService: UserService
  let integrationService: IntegrationService
  let workspaceService: WorkspaceService
  let projectService: ProjectService
  let environmentService: EnvironmentService

  let user1: User, user2: User
  let workspace1: Workspace, workspace2: Workspace
  let integration1: Integration
  let project1: Project, project2: Project
  let environment1: Environment, environment2: Environment

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
    const createUser1Response = (await userService.createUser({
      email: 'john@keyshade.xyz',
      name: 'John',
      isActive: true,
      isAdmin: false,
      isOnboardingFinished: true
    })) as User & { defaultWorkspace: Workspace }

    const createUser2Response = (await userService.createUser({
      email: 'jane@keyshade.xyz',
      name: 'Jane',
      isActive: true,
      isAdmin: false,
      isOnboardingFinished: true
    })) as User & { defaultWorkspace: Workspace }

    workspace1 = createUser1Response.defaultWorkspace
    workspace2 = createUser2Response.defaultWorkspace

    delete createUser1Response.defaultWorkspace
    delete createUser2Response.defaultWorkspace

    user1 = createUser1Response
    user2 = createUser2Response

    integration1 = await integrationService.createIntegration(
      user1,
      {
        name: 'Integration 1',
        type: IntegrationType.DISCORD,
        metadata: {
          webhookUrl: 'DUMMY_URL'
        },
        notifyOn: [EventType.WORKSPACE_UPDATED]
      },
      workspace1.id
    )

    project1 = (await projectService.createProject(user1, workspace1.id, {
      name: 'Project 1',
      description: 'Description 1'
    })) as Project

    project2 = (await projectService.createProject(user2, workspace2.id, {
      name: 'Project 2',
      description: 'Description 2'
    })) as Project

    environment1 = (await environmentService.createEnvironment(
      user1,
      {
        name: 'Environment 1',
        description: 'Description 1'
      },
      project1.id
    )) as Environment

    environment2 = (await environmentService.createEnvironment(
      user2,
      {
        name: 'Environment 2',
        description: 'Description 2'
      },
      project2.id
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

  it('should not be able to create an integration in the workspace with the same name', async () => {
    const result = await app.inject({
      method: 'POST',
      url: `/integration/${workspace1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      },
      payload: {
        name: 'Integration 1',
        type: IntegrationType.DISCORD,
        metadata: {
          webhookUrl: 'DUMMY_URL'
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
          webhookUrl: 'DUMMY_URL'
        },
        notifyOn: [EventType.WORKSPACE_UPDATED]
      }
    })

    expect(result.statusCode).toEqual(404)
  })

  it('should not be able to create an integration in a workspace in which the user is not a member', async () => {
    const result = await app.inject({
      method: 'POST',
      url: `/integration/${workspace2.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      },
      payload: {
        name: 'Integration 2',
        type: IntegrationType.DISCORD,
        metadata: {
          webhookUrl: 'DUMMY_URL'
        },
        notifyOn: [EventType.WORKSPACE_UPDATED]
      }
    })

    expect(result.statusCode).toEqual(401)
  })

  it('should not be able to create an integration for a project the user does not have access to', async () => {
    const result = await app.inject({
      method: 'POST',
      url: `/integration/${workspace1.id}`,
      headers: {
        'x-e2e-user-email': user2.email
      },
      payload: {
        name: 'Integration 2',
        type: IntegrationType.DISCORD,
        metadata: {
          webhookUrl: 'DUMMY_URL'
        },
        notifyOn: [EventType.WORKSPACE_UPDATED],
        projectId: project1.id
      }
    })

    expect(result.statusCode).toEqual(401)
  })

  it('should not be able to create an integration in a project that does not exist', async () => {
    const result = await app.inject({
      method: 'POST',
      url: `/integration/${workspace1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      },
      payload: {
        name: 'Integration 2',
        type: IntegrationType.DISCORD,
        metadata: {
          webhookUrl: 'DUMMY_URL'
        },
        notifyOn: [EventType.WORKSPACE_UPDATED],
        projectId: '999999'
      }
    })

    expect(result.statusCode).toEqual(404)
  })

  it('should throw an error if environment id is specified and not project id', async () => {
    const result = await app.inject({
      method: 'POST',
      url: `/integration/${workspace1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      },
      payload: {
        name: 'Integration 2',
        type: IntegrationType.DISCORD,
        metadata: {
          webhookUrl: 'DUMMY_URL'
        },
        notifyOn: [EventType.WORKSPACE_UPDATED],
        environmentId: '123'
      }
    })

    expect(result.statusCode).toEqual(400)
    expect(result.json().message).toEqual(
      'Environment can only be provided if project is also provided'
    )
  })

  it('should not be able to create an integration for an environment the user does not have access to', async () => {
    const result = await app.inject({
      method: 'POST',
      url: `/integration/${workspace1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      },
      payload: {
        name: 'Integration 2',
        type: IntegrationType.DISCORD,
        metadata: {
          webhookUrl: 'DUMMY_URL'
        },
        notifyOn: [EventType.WORKSPACE_UPDATED],
        environmentId: environment2.id,
        projectId: project1.id
      }
    })

    expect(result.statusCode).toEqual(401)
  })

  it('should not be able to create an integration in an environment that does not exist', async () => {
    const result = await app.inject({
      method: 'POST',
      url: `/integration/${workspace1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      },
      payload: {
        name: 'Integration 2',
        type: IntegrationType.DISCORD,
        metadata: {
          webhookUrl: 'DUMMY_URL'
        },
        notifyOn: [EventType.WORKSPACE_UPDATED],
        environmentId: '999999',
        projectId: project1.id
      }
    })

    expect(result.statusCode).toEqual(404)
  })

  it('should be able to create an integration without any project or environment id', async () => {
    const result = await app.inject({
      method: 'POST',
      url: `/integration/${workspace1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      },
      payload: {
        name: 'Integration 2',
        type: IntegrationType.DISCORD,
        metadata: {
          webhookUrl: 'DUMMY_URL'
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
      url: `/integration/${integration1.id}`,
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
      url: `/integration/${integration1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      },
      payload: {
        name: 'Integration 1'
      }
    })

    expect(result.statusCode).toEqual(409)
  })

  it('should have access to a a project if projectId is provided while update', async () => {
    // Create the project
    const project = (await projectService.createProject(user1, workspace1.id, {
      name: 'Project 3',
      description: 'Description 3'
    })) as Project

    // Update the integration
    const result = await app.inject({
      method: 'PUT',
      url: `/integration/${integration1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      },
      payload: {
        projectId: project.id
      }
    })

    expect(result.statusCode).toEqual(200)

    const updatedIntegration = await prisma.integration.findUnique({
      where: {
        id: integration1.id
      }
    })

    expect(updatedIntegration).toBeDefined()
    expect(updatedIntegration!.projectId).toEqual(project.id)
  })

  it('should fail to update if projectId is provided but the user does not have access to the project', async () => {
    // Update the integration
    const result = await app.inject({
      method: 'PUT',
      url: `/integration/${integration1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      },
      payload: {
        projectId: project2.id
      }
    })

    expect(result.statusCode).toEqual(401)
  })

  it('should fail to update if projectId is provided but the project does not exist', async () => {
    // Update the integration
    const result = await app.inject({
      method: 'PUT',
      url: `/integration/${integration1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      },
      payload: {
        projectId: '999999'
      }
    })

    expect(result.statusCode).toEqual(404)
  })

  it('should fail to update if the environment id is specified and not the project id', async () => {
    // Update the integration
    const result = await app.inject({
      method: 'PUT',
      url: `/integration/${integration1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      },
      payload: {
        environmentId: environment1.id
      }
    })

    expect(result.statusCode).toEqual(400)
    expect(result.json().message).toEqual(
      'Environment can only be provided if project is also provided'
    )
  })

  it('should not fail to update if the integration has projectId present and only environmentId is updated', async () => {
    // Create the integration
    const integration = await integrationService.createIntegration(
      user1,
      {
        name: 'Integration 2',
        type: IntegrationType.DISCORD,
        metadata: {
          webhookUrl: 'DUMMY_URL'
        },
        notifyOn: [EventType.WORKSPACE_UPDATED],
        projectId: project1.id
      },
      workspace1.id
    )

    // Update the integration
    const result = await app.inject({
      method: 'PUT',
      url: `/integration/${integration.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      },
      payload: {
        environmentId: environment1.id
      }
    })

    expect(result.statusCode).toEqual(200)

    const updatedIntegration = await prisma.integration.findUnique({
      where: {
        id: integration.id
      }
    })

    expect(updatedIntegration).toBeDefined()
    expect(updatedIntegration!.environmentId).toEqual(environment1.id)
  })

  it('should fail to update if the user does not have access to the environment', async () => {
    // Update the integration
    const result = await app.inject({
      method: 'PUT',
      url: `/integration/${integration1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      },
      payload: {
        projectId: project1.id,
        environmentId: environment2.id
      }
    })

    expect(result.statusCode).toEqual(401)
  })

  it('should fail to update if the environment does not exist', async () => {
    // Update the integration
    const result = await app.inject({
      method: 'PUT',
      url: `/integration/${integration1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      },
      payload: {
        projectId: project1.id,
        environmentId: '999999'
      }
    })

    expect(result.statusCode).toEqual(404)
  })

  it('should be able to update the integration', async () => {
    // Update the integration
    const result = await app.inject({
      method: 'PUT',
      url: `/integration/${integration1.id}`,
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
    expect(updatedIntegration!.name).toEqual('Integration 2')
  })

  it('should be able to fetch an integration', async () => {
    const result = await app.inject({
      method: 'GET',
      url: `/integration/${integration1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(result.statusCode).toEqual(200)
    expect(result.json().id).toEqual(integration1.id)
  })

  it('should be able to fetch all integrations on first page', async () => {
    const result = await app.inject({
      method: 'GET',
      url: `/integration/all/${workspace1.id}?page=0&limit=10`,
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
      `/integration/all/${workspace1.id}?page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(metadata.links.first).toEqual(
      `/integration/all/${workspace1.id}?page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/integration/all/${workspace1.id}?page=0&limit=10&sort=name&order=asc&search=`
    )
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
      url: `/integration/${integration1.id}`,
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(result.statusCode).toEqual(401)
  })

  it('should be able to delete an integration', async () => {
    const result = await app.inject({
      method: 'DELETE',
      url: `/integration/${integration1.id}`,
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
