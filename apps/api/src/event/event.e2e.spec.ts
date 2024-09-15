import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import {
  EventSeverity,
  EventSource,
  EventTriggerer,
  EventType,
  Project,
  ProjectAccessLevel,
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
import { WorkspaceService } from '@/workspace/service/workspace.service'
import { WorkspaceModule } from '@/workspace/workspace.module'
import { EnvironmentService } from '@/environment/service/environment.service'
import { WorkspaceRoleService } from '@/workspace-role/service/workspace-role.service'
import { ProjectService } from '@/project/service/project.service'
import { SecretService } from '@/secret/service/secret.service'
import { SecretModule } from '@/secret/secret.module'
import { ProjectModule } from '@/project/project.module'
import { EnvironmentModule } from '@/environment/environment.module'
import { VariableService } from '@/variable/service/variable.service'
import { VariableModule } from '@/variable/variable.module'
import { QueryTransformPipe } from '@/common/pipes/query.transform.pipe'
import { createEvent } from '@/common/event'

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
  })

  beforeEach(async () => {
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
    const workspace = await workspaceService.createWorkspace(user, {
      name: 'My workspace',
      icon: "🤓"
    })

    expect(workspace).toBeDefined()

    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.slug}?source=WORKSPACE`,
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
    expect(event.itemId).toBe(workspace.id)
    expect(event.userId).toBe(user.id)
    expect(event.workspaceId).toBe(workspace.id)

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/event/${workspace.slug}?source=WORKSPACE&page=0&limit=10&search=`
    )
    expect(metadata.links.first).toEqual(
      `/event/${workspace.slug}?source=WORKSPACE&page=0&limit=10&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/event/${workspace.slug}?source=WORKSPACE&page=0&limit=10&search=`
    )
  })

  it('should be able to fetch a project event', async () => {
    const workspace = await workspaceService.createWorkspace(user, {
      name: 'My workspace',
        icon: "🤓"
    })

    const project = (await projectService.createProject(user, workspace.slug, {
      name: 'My project',
      description: 'Some description',
      environments: [],
      storePrivateKey: false,
      accessLevel: ProjectAccessLevel.GLOBAL
    })) as Project

    expect(project).toBeDefined()

    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.slug}?source=PROJECT`,
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
    expect(event.itemId).toBe(project.id)
    expect(event.userId).toBe(user.id)
    expect(event.workspaceId).toBe(workspace.id)

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/event/${workspace.slug}?source=PROJECT&page=0&limit=10&search=`
    )
    expect(metadata.links.first).toEqual(
      `/event/${workspace.slug}?source=PROJECT&page=0&limit=10&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/event/${workspace.slug}?source=PROJECT&page=0&limit=10&search=`
    )
  })

  it('should be able to fetch an environment event', async () => {
    const workspace = await workspaceService.createWorkspace(user, {
      name: 'My workspace',
      icon: "🤓"
    })

    const project = await projectService.createProject(user, workspace.slug, {
      name: 'My project',
      description: 'Some description',
      environments: [],
      storePrivateKey: false,
      accessLevel: ProjectAccessLevel.GLOBAL
    })

    const environment = await environmentService.createEnvironment(
      user,
      {
        name: 'My environment',
        description: 'Some description'
      },
      project.slug
    )

    expect(environment).toBeDefined()

    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.slug}?source=ENVIRONMENT`,
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
    expect(event.itemId).toBe(environment.id)
    expect(event.userId).toBe(user.id)
    expect(event.workspaceId).toBe(workspace.id)

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/event/${workspace.slug}?source=ENVIRONMENT&page=0&limit=10&search=`
    )
    expect(metadata.links.first).toEqual(
      `/event/${workspace.slug}?source=ENVIRONMENT&page=0&limit=10&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/event/${workspace.slug}?source=ENVIRONMENT&page=0&limit=10&search=`
    )
  })

  it('should be able to fetch a secret event', async () => {
    const workspace = await workspaceService.createWorkspace(user, {
      name: 'My workspace',
       icon: "🤓"
    })

    const project = await projectService.createProject(user, workspace.slug, {
      name: 'My project',
      description: 'Some description',
      environments: [],
      storePrivateKey: false,
      accessLevel: ProjectAccessLevel.GLOBAL
    })

    const environment = await environmentService.createEnvironment(
      user,
      {
        name: 'My environment',
        description: 'Some description'
      },
      project.slug
    )

    const secret = await secretService.createSecret(
      user,
      {
        name: 'My secret',
        entries: [
          {
            value: 'My value',
            environmentSlug: environment.slug
          }
        ],
        note: 'Some note',
        rotateAfter: '720'
      },
      project.slug
    )

    expect(secret).toBeDefined()

    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.slug}?source=SECRET`,
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
    expect(event.itemId).toBe(secret.id)
    expect(event.userId).toBe(user.id)
    expect(event.workspaceId).toBe(workspace.id)

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/event/${workspace.slug}?source=SECRET&page=0&limit=10&search=`
    )
    expect(metadata.links.first).toEqual(
      `/event/${workspace.slug}?source=SECRET&page=0&limit=10&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/event/${workspace.slug}?source=SECRET&page=0&limit=10&search=`
    )
  })

  it('should be able to fetch a variable event', async () => {
    const workspace = await workspaceService.createWorkspace(user, {
      name: 'My workspace',
       icon: "🤓"
    })

    const project = await projectService.createProject(user, workspace.slug, {
      name: 'My project',
      description: 'Some description',
      environments: [],
      storePrivateKey: false,
      accessLevel: ProjectAccessLevel.GLOBAL
    })

    const environment = await environmentService.createEnvironment(
      user,
      {
        name: 'My environment',
        description: 'Some description'
      },
      project.slug
    )

    const variable = (await variableService.createVariable(
      user,
      {
        name: 'My variable',
        entries: [
          {
            value: 'My value',
            environmentSlug: environment.slug
          }
        ],
        note: 'Some note'
      },
      project.slug
    )) as Variable

    expect(variable).toBeDefined()

    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.slug}?source=VARIABLE`,
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
    expect(event.itemId).toBe(variable.id)
    expect(event.userId).toBe(user.id)
    expect(event.workspaceId).toBe(workspace.id)

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/event/${workspace.slug}?source=VARIABLE&page=0&limit=10&search=`
    )
    expect(metadata.links.first).toEqual(
      `/event/${workspace.slug}?source=VARIABLE&page=0&limit=10&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/event/${workspace.slug}?source=VARIABLE&page=0&limit=10&search=`
    )
  })

  it('should be able to fetch a workspace role event', async () => {
    const workspace = await workspaceService.createWorkspace(user, {
      name: 'My workspace',
        icon: "🤓"
    })

    const project = await projectService.createProject(user, workspace.slug, {
      name: 'My project',
      description: 'Some description',
      environments: [],
      storePrivateKey: false,
      accessLevel: ProjectAccessLevel.GLOBAL
    })

    const workspaceRole = await workspaceRoleService.createWorkspaceRole(
      user,
      workspace.slug,
      {
        name: 'My role',
        description: 'Some description',
        colorCode: '#000000',
        authorities: [],
        projectSlugs: [project.slug]
      }
    )

    expect(workspaceRole).toBeDefined()

    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.slug}?source=WORKSPACE_ROLE`,
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
    expect(event.itemId).toBe(workspaceRole.id)
    expect(event.userId).toBe(user.id)
    expect(event.workspaceId).toBe(workspace.id)

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/event/${workspace.slug}?source=WORKSPACE_ROLE&page=0&limit=10&search=`
    )
    expect(metadata.links.first).toEqual(
      `/event/${workspace.slug}?source=WORKSPACE_ROLE&page=0&limit=10&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/event/${workspace.slug}?source=WORKSPACE_ROLE&page=0&limit=10&search=`
    )
  })

  it('should be able to fetch all events', async () => {
    const workspace = await workspaceService.createWorkspace(user, {
      name: 'My workspace',
        icon: "🤓"
    })

    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.slug}`,
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().items).toHaveLength(1)

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/event/${workspace.slug}?page=0&limit=10&search=`
    )
    expect(metadata.links.first).toEqual(
      `/event/${workspace.slug}?page=0&limit=10&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/event/${workspace.slug}?page=0&limit=10&search=`
    )
  })

  it('should throw an error with wrong severity value', async () => {
    const workspace = await workspaceService.createWorkspace(user, {
      name: 'My workspace',
      icon: "🤓"
    })

    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.slug}?severity=INVALID`,
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(400)
  })

  it('should throw an error with wrong source value', async () => {
    const workspace = await workspaceService.createWorkspace(user, {
      name: 'My workspace',
        icon: "🤓"
    })

    const response = await app.inject({
      method: 'GET',
      url: `/event/${workspace.slug}?source=INVALID`,
      headers: {
        'x-e2e-user-email': user.email
      }
    })

    expect(response.statusCode).toBe(400)
  })

  it('should throw an error if user is not provided in event creation for user-triggered event', async () => {
    const workspace = await workspaceService.createWorkspace(user, {
      name: 'My workspace',
        icon: "🤓"
    })

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
    const workspace = await workspaceService.createWorkspace(user, {
      name: 'My workspace',
       icon: "🤓"
    })

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
    const workspace = await workspaceService.createWorkspace(user, {
      name: 'My workspace',
        icon: "🤓"
    })

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

  afterEach(async () => {
    await prisma.$transaction([
      prisma.user.deleteMany(),
      prisma.workspace.deleteMany()
    ])
  })

  afterAll(async () => {
    await app.close()
  })
})
