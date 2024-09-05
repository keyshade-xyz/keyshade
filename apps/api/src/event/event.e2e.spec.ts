import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import {
  Environment,
  EventSeverity,
  EventSource,
  EventTriggerer,
  EventType,
  Project,
  ProjectAccessLevel,
  Secret,
  User,
  Variable,
  Workspace
} from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { Test } from '@nestjs/testing'
import { WorkspaceRoleModule } from '@/workspace-role/workspace-role.module'
import { AppModule } from '@/app/app.module'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
import { EventModule } from './event.module'
import cleanUp from '@/common/cleanup'
import { WorkspaceService } from '@/workspace/service/workspace.service'
import { WorkspaceModule } from '@/workspace/workspace.module'
import { EnvironmentService } from '@/environment/service/environment.service'
import { WorkspaceRoleService } from '@/workspace-role/service/workspace-role.service'
import { ProjectService } from '@/project/service/project.service'
import { SecretService } from '@/secret/service/secret.service'
import { SecretModule } from '@/secret/secret.module'
import { ProjectModule } from '@/project/project.module'
import { EnvironmentModule } from '@/environment/environment.module'
import createEvent from '@/common/create-event'
import { VariableService } from '@/variable/service/variable.service'
import { VariableModule } from '@/variable/variable.module'
import { QueryTransformPipe } from '@/common/query.transform.pipe'

describe('Event Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService

  let workspaceService: WorkspaceService
  let environmentService: EnvironmentService
  let workspaceRoleService: WorkspaceRoleService
  let projectService: ProjectService
  let secretService: SecretService
  let variableService: VariableService

  let user: User
  let workspace: Workspace
  let project: Project
  let environment: Environment

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        EventModule,
        WorkspaceModule,
        WorkspaceRoleModule,
        SecretModule,
        ProjectModule,
        EnvironmentModule,
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
    workspaceService = moduleRef.get(WorkspaceService)
    environmentService = moduleRef.get(EnvironmentService)
    workspaceRoleService = moduleRef.get(WorkspaceRoleService)
    projectService = moduleRef.get(ProjectService)
    secretService = moduleRef.get(SecretService)
    variableService = moduleRef.get(VariableService)

    app.useGlobalPipes(new QueryTransformPipe())

    await app.init()
    await app.getHttpAdapter().getInstance().ready()

    await cleanUp(prisma)

    user = await prisma.user.create({
      data: {
        email: 'johndoe@keyshade.xyz',
        name: 'John Doe',
        isOnboardingFinished: true
      }
    })
  })

  it('should be defined', async () => {
    expect(app).toBeDefined()
    expect(prisma).toBeDefined()
  })

  it('should be able to fetch a workspace event', async () => {
    const newWorkspace = await workspaceService.createWorkspace(user, {
      name: 'My workspace',
      description: 'Some description'
    })
    workspace = newWorkspace

    expect(newWorkspace).toBeDefined()

    const response = await app.inject({
      method: 'GET',
      url: `/event/${newWorkspace.id}?source=WORKSPACE`,
      headers: {
        'x-e2e-user-email': user.email
      }
    })
    expect(response.statusCode).toBe(200)
    const event = response.json().items[0]

    expect(event.id).toBeDefined()
    expect(event.title).toBeDefined()
    expect(event.source).toBe(EventSource.WORKSPACE)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.WORKSPACE_CREATED)
    expect(event.timestamp).toBeDefined()
    expect(event.itemId).toBe(newWorkspace.id)
    expect(event.userId).toBe(user.id)
    expect(event.workspaceId).toBe(newWorkspace.id)

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/event/${newWorkspace.id}?source=WORKSPACE&page=0&limit=10&search=`
    )
    expect(metadata.links.first).toEqual(
      `/event/${newWorkspace.id}?source=WORKSPACE&page=0&limit=10&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/event/${newWorkspace.id}?source=WORKSPACE&page=0&limit=10&search=`
    )
  })

  it('should be able to fetch a project event', async () => {
    const newProject = (await projectService.createProject(user, workspace.id, {
      name: 'My project',
      description: 'Some description',
      environments: [],
      storePrivateKey: false,
      accessLevel: ProjectAccessLevel.GLOBAL
    })) as Project
    project = newProject

    expect(newProject).toBeDefined()

    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.id}?source=PROJECT`,
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(200)
    const event = response.json().items[0]

    expect(event.id).toBeDefined()
    expect(event.title).toBeDefined()
    expect(event.source).toBe(EventSource.PROJECT)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.PROJECT_CREATED)
    expect(event.timestamp).toBeDefined()
    expect(event.itemId).toBe(newProject.id)
    expect(event.userId).toBe(user.id)
    expect(event.workspaceId).toBe(workspace.id)

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/event/${workspace.id}?source=PROJECT&page=0&limit=10&search=`
    )
    expect(metadata.links.first).toEqual(
      `/event/${workspace.id}?source=PROJECT&page=0&limit=10&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/event/${workspace.id}?source=PROJECT&page=0&limit=10&search=`
    )
  })

  it('should be able to fetch an environment event', async () => {
    const newEnvironment = (await environmentService.createEnvironment(
      user,
      {
        name: 'My environment',
        description: 'Some description'
      },
      project.id
    )) as Environment
    environment = newEnvironment

    expect(newEnvironment).toBeDefined()

    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.id}?source=ENVIRONMENT`,
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(200)
    const event = response.json().items[0]

    expect(event.id).toBeDefined()
    expect(event.title).toBeDefined()
    expect(event.source).toBe(EventSource.ENVIRONMENT)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.ENVIRONMENT_ADDED)
    expect(event.timestamp).toBeDefined()
    expect(event.itemId).toBe(newEnvironment.id)
    expect(event.userId).toBe(user.id)
    expect(event.workspaceId).toBe(workspace.id)

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/event/${workspace.id}?source=ENVIRONMENT&page=0&limit=10&search=`
    )
    expect(metadata.links.first).toEqual(
      `/event/${workspace.id}?source=ENVIRONMENT&page=0&limit=10&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/event/${workspace.id}?source=ENVIRONMENT&page=0&limit=10&search=`
    )
  })

  it('should be able to fetch a secret event', async () => {
    const newSecret = (await secretService.createSecret(
      user,
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
      project.id
    )) as Secret

    expect(newSecret).toBeDefined()

    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.id}?source=SECRET`,
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(200)
    const event = response.json().items[0]

    expect(event.id).toBeDefined()
    expect(event.title).toBeDefined()
    expect(event.source).toBe(EventSource.SECRET)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.SECRET_ADDED)
    expect(event.timestamp).toBeDefined()
    expect(event.itemId).toBe(newSecret.id)
    expect(event.userId).toBe(user.id)
    expect(event.workspaceId).toBe(workspace.id)

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/event/${workspace.id}?source=SECRET&page=0&limit=10&search=`
    )
    expect(metadata.links.first).toEqual(
      `/event/${workspace.id}?source=SECRET&page=0&limit=10&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/event/${workspace.id}?source=SECRET&page=0&limit=10&search=`
    )
  })

  it('should be able to fetch a variable event', async () => {
    const newVariable = (await variableService.createVariable(
      user,
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
      project.id
    )) as Variable

    expect(newVariable).toBeDefined()

    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.id}?source=VARIABLE`,
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(200)
    // expect(response.json()).toBe({})
    const event = response.json().items[0]

    expect(event.id).toBeDefined()
    expect(event.title).toBeDefined()
    expect(event.source).toBe(EventSource.VARIABLE)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.VARIABLE_ADDED)
    expect(event.timestamp).toBeDefined()
    expect(event.itemId).toBe(newVariable.id)
    expect(event.userId).toBe(user.id)
    expect(event.workspaceId).toBe(workspace.id)

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/event/${workspace.id}?source=VARIABLE&page=0&limit=10&search=`
    )
    expect(metadata.links.first).toEqual(
      `/event/${workspace.id}?source=VARIABLE&page=0&limit=10&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/event/${workspace.id}?source=VARIABLE&page=0&limit=10&search=`
    )
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

    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.id}?source=WORKSPACE_ROLE`,
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(200)
    const event = response.json().items[0]

    expect(event.id).toBeDefined()
    expect(event.title).toBeDefined()
    expect(event.source).toBe(EventSource.WORKSPACE_ROLE)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.WORKSPACE_ROLE_CREATED)
    expect(event.timestamp).toBeDefined()
    expect(event.itemId).toBe(newWorkspaceRole.id)
    expect(event.userId).toBe(user.id)
    expect(event.workspaceId).toBe(workspace.id)

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/event/${workspace.id}?source=WORKSPACE_ROLE&page=0&limit=10&search=`
    )
    expect(metadata.links.first).toEqual(
      `/event/${workspace.id}?source=WORKSPACE_ROLE&page=0&limit=10&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/event/${workspace.id}?source=WORKSPACE_ROLE&page=0&limit=10&search=`
    )
  })

  it('should be able to fetch all events', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.id}`,
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().items).toHaveLength(6)

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(6)
    expect(metadata.links.self).toEqual(
      `/event/${workspace.id}?page=0&limit=10&search=`
    )
    expect(metadata.links.first).toEqual(
      `/event/${workspace.id}?page=0&limit=10&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/event/${workspace.id}?page=0&limit=10&search=`
    )
  })

  it('should be able to fetch 2nd page of all events', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.id}?page=1&limit=3&`,
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().items).toHaveLength(3)

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(6)
    expect(metadata.links.self).toEqual(
      `/event/${workspace.id}?page=1&limit=3&search=`
    )
    expect(metadata.links.first).toEqual(
      `/event/${workspace.id}?page=0&limit=3&search=`
    )
    expect(metadata.links.previous).toEqual(
      `/event/${workspace.id}?page=0&limit=3&search=`
    )
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/event/${workspace.id}?page=1&limit=3&search=`
    )
  })

  it('should throw an error with wrong severity value', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.id}?severity=INVALID`,
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(400)
  })

  it('should throw an error with wrong source value', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.id}?source=INVALID`,
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(400)
  })

  it('should throw an error if user is not provided in event creation for user-triggered event', async () => {
    try {
      await createEvent(
        {
          triggerer: EventTriggerer.USER,
          severity: EventSeverity.INFO,
          type: EventType.ACCEPTED_INVITATION,
          source: EventSource.WORKSPACE,
          title: 'User updated',
          description: 'User updated',
          metadata: {},
          workspaceId: workspace.id
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
          type: EventType.INVITED_TO_WORKSPACE,
          source: 'INVALID' as EventSource,
          title: 'User updated',
          description: 'User updated',
          metadata: {},
          workspaceId: workspace.id
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
          metadata: {},
          workspaceId: workspace.id
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
