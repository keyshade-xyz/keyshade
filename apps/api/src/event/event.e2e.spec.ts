import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import {
  Authority,
  Environment,
  EventSeverity,
  EventSource,
  EventTriggerer,
  EventType,
  Project,
  User,
  Workspace
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { Test } from '@nestjs/testing'
import { WorkspaceRoleModule } from '../workspace-role/workspace-role.module'
import { AppModule } from '../app/app.module'
import { MAIL_SERVICE } from '../mail/services/interface.service'
import { MockMailService } from '../mail/services/mock.service'
import { EventModule } from './event.module'
import { UserModule } from '../user/user.module'
import { UserService } from '../user/service/user.service'
import cleanUp from '../common/cleanup'
import { WorkspaceService } from '../workspace/service/workspace.service'
import { WorkspaceModule } from '../workspace/workspace.module'
import { ApiKeyService } from '../api-key/service/api-key.service'
import { EnvironmentService } from '../environment/service/environment.service'
import { WorkspaceRoleService } from '../workspace-role/service/workspace-role.service'
import { ProjectService } from '../project/service/project.service'
import { SecretService } from '../secret/service/secret.service'
import { SecretModule } from '../secret/secret.module'
import { ProjectModule } from '../project/project.module'
import { EnvironmentModule } from '../environment/environment.module'
import { ApiKeyModule } from '../api-key/api-key.module'
import createEvent from '../common/create-event'
import fetchEvents from '../common/fetch-events'
import { VariableService } from '../variable/service/variable.service'
import { VariableModule } from '../variable/variable.module'

describe('Event Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService

  let userService: UserService
  let workspaceService: WorkspaceService
  let apiKeyService: ApiKeyService
  let environmentService: EnvironmentService
  let workspaceRoleService: WorkspaceRoleService
  let projectService: ProjectService
  let secretService: SecretService
  let variableService: VariableService

  let user: User
  let workspace: Workspace
  let project: Project
  let environment: Environment

  const totalEvents = []

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        EventModule,
        UserModule,
        WorkspaceModule,
        WorkspaceRoleModule,
        SecretModule,
        ProjectModule,
        EnvironmentModule,
        ApiKeyModule,
        VariableModule
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
    workspaceService = moduleRef.get(WorkspaceService)
    apiKeyService = moduleRef.get(ApiKeyService)
    environmentService = moduleRef.get(EnvironmentService)
    workspaceRoleService = moduleRef.get(WorkspaceRoleService)
    projectService = moduleRef.get(ProjectService)
    secretService = moduleRef.get(SecretService)
    variableService = moduleRef.get(VariableService)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()

    await cleanUp(prisma)

    user = await prisma.user.create({
      data: {
        email: 'johndoe@keyshade.xyz',
        name: 'John Doe'
      }
    })
  })

  it('should be defined', async () => {
    expect(app).toBeDefined()
    expect(prisma).toBeDefined()
  })

  it('should be able to fetch a user event', async () => {
    const updatedUser = await userService.updateSelf(user, {
      isOnboardingFinished: true
    })
    user = updatedUser

    expect(updatedUser).toBeDefined()

    const response = await fetchEvents(app, user)

    totalEvents.push({
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      source: EventSource.USER,
      triggerer: EventTriggerer.USER,
      severity: EventSeverity.INFO,
      type: EventType.USER_UPDATED,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(totalEvents)
  })

  it('should be able to fetch API key event', async () => {
    const newApiKey = await apiKeyService.createApiKey(user, {
      name: 'My API key',
      authorities: [Authority.READ_API_KEY]
    })

    expect(newApiKey).toBeDefined()

    const response = await fetchEvents(app, user, `apiKeyId=${newApiKey.id}`)

    const event = {
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      source: EventSource.API_KEY,
      triggerer: EventTriggerer.USER,
      severity: EventSeverity.INFO,
      type: EventType.API_KEY_ADDED,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    totalEvents.push(event)

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([event])
  })

  it('should be able to fetch a workspace event', async () => {
    const newWorkspace = await workspaceService.createWorkspace(user, {
      name: 'My workspace',
      description: 'Some description'
    })
    workspace = newWorkspace

    expect(newWorkspace).toBeDefined()

    const response = await fetchEvents(
      app,
      user,
      `workspaceId=${newWorkspace.id}`
    )

    const event = {
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      source: EventSource.WORKSPACE,
      triggerer: EventTriggerer.USER,
      severity: EventSeverity.INFO,
      type: EventType.WORKSPACE_CREATED,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    totalEvents.push(event)

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([event])
  })

  it('should be able to fetch a project event', async () => {
    const newProject = await projectService.createProject(user, workspace.id, {
      name: 'My project',
      description: 'Some description',
      environments: [],
      storePrivateKey: false
    })
    project = newProject

    expect(newProject).toBeDefined()

    const response = await fetchEvents(app, user, `projectId=${newProject.id}`)

    const event = {
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      source: EventSource.PROJECT,
      triggerer: EventTriggerer.USER,
      severity: EventSeverity.INFO,
      type: EventType.PROJECT_CREATED,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    totalEvents.push(event)

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([event])
  })

  it('should be able to fetch an environment event', async () => {
    const newEnvironment = await environmentService.createEnvironment(
      user,
      {
        name: 'My environment',
        description: 'Some description',
        isDefault: false
      },
      project.id
    )
    environment = newEnvironment

    expect(newEnvironment).toBeDefined()

    const response = await fetchEvents(
      app,
      user,
      `environmentId=${newEnvironment.id}`
    )

    const event = {
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      source: EventSource.ENVIRONMENT,
      triggerer: EventTriggerer.USER,
      severity: EventSeverity.INFO,
      type: EventType.ENVIRONMENT_ADDED,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    totalEvents.push(event)

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([event])
  })

  it('should be able to fetch a secret event', async () => {
    const newSecret = await secretService.createSecret(
      user,
      {
        name: 'My secret',
        value: 'My value',
        environmentId: environment.id,
        rotateAfter: '720'
      },
      project.id
    )

    expect(newSecret).toBeDefined()

    const response = await fetchEvents(app, user, `secretId=${newSecret.id}`)

    const event = {
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      source: EventSource.SECRET,
      triggerer: EventTriggerer.USER,
      severity: EventSeverity.INFO,
      type: EventType.SECRET_ADDED,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    totalEvents.push(event)

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([event])
  })

  it('should be able to fetch a variable event', async () => {
    const newVariable = await variableService.createVariable(
      user,
      {
        name: 'My variable',
        value: 'My value',
        environmentId: environment.id
      },
      project.id
    )

    expect(newVariable).toBeDefined()

    const response = await fetchEvents(
      app,
      user,
      `variableId=${newVariable.id}`
    )

    const event = {
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      source: EventSource.VARIABLE,
      triggerer: EventTriggerer.USER,
      severity: EventSeverity.INFO,
      type: EventType.VARIABLE_ADDED,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    totalEvents.push(event)

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([event])
  })

  it('should be able to fetch a workspace role event', async () => {
    const newWorkspaceRole = await workspaceRoleService.createWorkspaceRole(
      user,
      workspace.id,
      {
        name: 'My role',
        description: 'Some description',
        colorCode: '#000000',
        authorities: [],
        projectIds: [project.id]
      }
    )

    expect(newWorkspaceRole).toBeDefined()

    const response = await fetchEvents(
      app,
      user,
      `workspaceRoleId=${newWorkspaceRole.id}`
    )

    const event = {
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      source: EventSource.WORKSPACE_ROLE,
      triggerer: EventTriggerer.USER,
      severity: EventSeverity.INFO,
      type: EventType.WORKSPACE_ROLE_CREATED,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    totalEvents.push(event)

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([event])
  })

  it('should be able to fetch all events', async () => {
    const response = await fetchEvents(app, user)

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(totalEvents)
  })

  it('should throw an error with wrong severity value', async () => {
    const response = await fetchEvents(app, user, 'severity=WRONG')

    expect(response.statusCode).toBe(400)
  })

  it('should throw an error if user is not provided in event creation for user-triggered event', async () => {
    try {
      await createEvent(
        {
          triggerer: EventTriggerer.USER,
          severity: EventSeverity.INFO,
          type: EventType.USER_UPDATED,
          source: EventSource.USER,
          title: 'User updated',
          description: 'User updated',
          metadata: {}
        },
        prisma
      )
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  it('should throw an exception for invalid event source', async () => {
    try {
      await createEvent(
        {
          triggerer: EventTriggerer.SYSTEM,
          severity: EventSeverity.INFO,
          type: EventType.USER_UPDATED,
          source: 'INVALID' as EventSource,
          title: 'User updated',
          description: 'User updated',
          metadata: {}
        },
        prisma
      )
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  it('should throw an exception for invalid event type', async () => {
    try {
      await createEvent(
        {
          triggerer: EventTriggerer.SYSTEM,
          severity: EventSeverity.INFO,
          type: EventType.WORKSPACE_CREATED,
          source: EventSource.WORKSPACE,
          title: 'User updated',
          description: 'User updated',
          entity: {
            id: '1'
          } as Workspace,
          metadata: {}
        },
        prisma
      )
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  afterAll(async () => {
    await cleanUp(prisma)
  })
})
