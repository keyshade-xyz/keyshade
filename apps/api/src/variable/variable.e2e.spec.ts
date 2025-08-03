import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { PrismaService } from '@/prisma/prisma.service'
import { ProjectService } from '@/project/project.service'
import { WorkspaceService } from '@/workspace/workspace.service'
import {
  Environment,
  EventSeverity,
  EventSource,
  EventTriggerer,
  EventType,
  Project,
  Variable,
  VariableVersion,
  Workspace,
  ProjectAccessLevel
} from '@prisma/client'
import { Test } from '@nestjs/testing'
import { AppModule } from '@/app/app.module'
import { EventModule } from '@/event/event.module'
import { WorkspaceModule } from '@/workspace/workspace.module'
import { ProjectModule } from '@/project/project.module'
import { EnvironmentModule } from '@/environment/environment.module'
import { VariableModule } from './variable.module'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
import { EnvironmentService } from '@/environment/environment.service'
import { VariableService } from './variable.service'
import { EventService } from '@/event/event.service'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { mockDeep } from 'jest-mock-extended'
import { RedisClientType } from 'redis'
import { UserService } from '@/user/user.service'
import { UserModule } from '@/user/user.module'
import { QueryTransformPipe } from '@/common/pipes/query.transform.pipe'
import { fetchEvents } from '@/common/event'
import { AuthenticatedUser } from '@/user/user.types'
import { ValidationPipe } from '@nestjs/common'
import { TierLimitService } from '@/common/tier-limit.service'
import { SecretService } from '@/secret/secret.service'
import { SecretModule } from '@/secret/secret.module'

describe('Variable Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let projectService: ProjectService
  let workspaceService: WorkspaceService
  let environmentService: EnvironmentService
  let variableService: VariableService
  let eventService: EventService
  let userService: UserService
  let tierLimitService: TierLimitService
  let secretService: SecretService

  let user1: AuthenticatedUser, user2: AuthenticatedUser
  let workspace1: Workspace
  let project1: Project
  let environment1: Environment
  let environment2: Environment
  let variable1: Variable

  const USER_IP_ADDRESS = '127.0.0.1'

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        EventModule,
        WorkspaceModule,
        ProjectModule,
        EnvironmentModule,
        VariableModule,
        UserModule,
        SecretModule
      ]
    })
      .overrideProvider(MAIL_SERVICE)
      .useClass(MockMailService)
      .overrideProvider(REDIS_CLIENT)
      .useValue(mockDeep<RedisClientType>())
      .compile()

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    )
    prisma = moduleRef.get(PrismaService)
    projectService = moduleRef.get(ProjectService)
    workspaceService = moduleRef.get(WorkspaceService)
    environmentService = moduleRef.get(EnvironmentService)
    variableService = moduleRef.get(VariableService)
    eventService = moduleRef.get(EventService)
    userService = moduleRef.get(UserService)
    tierLimitService = moduleRef.get(TierLimitService)
    secretService = moduleRef.get(SecretService)

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true
      }),
      new QueryTransformPipe()
    )

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  beforeEach(async () => {
    const createUser1 = await userService.createUser({
      email: 'johndoe@keyshade.xyz',
      name: 'John Doe',
      isOnboardingFinished: true
    })

    const createUser2 = await userService.createUser({
      email: 'janedoe@keyshade.xyz',
      name: 'Jane Doe',
      isOnboardingFinished: true
    })

    workspace1 = createUser1.defaultWorkspace

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

    project1 = (await projectService.createProject(user1, workspace1.slug, {
      name: 'Project 1',
      description: 'Project 1 description',
      storePrivateKey: true,
      accessLevel: ProjectAccessLevel.PRIVATE,
      environments: [
        {
          name: 'Environment 1',
          description: 'Environment 1 description'
        },
        {
          name: 'Environment 2',
          description: 'Environment 2 description'
        }
      ]
    })) as Project

    environment1 = await prisma.environment.findFirst({
      where: {
        projectId: project1.id,
        name: 'Environment 1'
      }
    })

    environment2 = await prisma.environment.findFirst({
      where: {
        projectId: project1.id,
        name: 'Environment 2'
      }
    })

    variable1 = (await variableService.createVariable(
      user1,
      {
        name: 'Variable 1',
        entries: [
          {
            environmentSlug: environment1.slug,
            value: 'Variable 1 value'
          }
        ]
      },
      project1.slug
    )) as Variable
  })

  afterEach(async () => {
    await prisma.$transaction([
      prisma.user.deleteMany(),
      prisma.workspace.deleteMany()
    ])
  })

  it('should be defined', async () => {
    expect(app).toBeDefined()
    expect(prisma).toBeDefined()
    expect(projectService).toBeDefined()
    expect(workspaceService).toBeDefined()
    expect(environmentService).toBeDefined()
  })

  describe('Create Variable Tests', () => {
    it('should be able to create a variable', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/variable/${project1.slug}`,
        payload: {
          name: 'Variable 3',
          note: 'Variable 3 note',
          rotateAfter: '24',
          entries: [
            {
              value: 'Variable 3 value',
              environmentSlug: environment2.slug
            }
          ]
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(201)

      const body = response.json()

      expect(body).toBeDefined()
      expect(body.variable.name).toBe('Variable 3')
      expect(body.variable.slug).toBeDefined()
      expect(body.variable.note).toBe('Variable 3 note')
      expect(body.variable.projectId).toBe(project1.id)
      expect(body.values.length).toBe(1)
      expect(body.values[0].value).toBe('Variable 3 value')

      const variable = await prisma.variable.findUnique({
        where: {
          id: body.variable.id
        }
      })

      expect(variable).toBeDefined()
    })

    it('should bulk create multiple variables successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/variable/${project1.slug}/bulk`,
        payload: {
          variables: [
            {
              name: 'Bulk Variable 1',
              note: 'Bulk Var 1 note',
              entries: [{ value: 'v1', environmentSlug: environment1.slug }]
            },
            {
              name: 'Bulk Variable 2',
              note: 'Bulk Var 2 note',
              entries: [{ value: 'v2', environmentSlug: environment1.slug }]
            }
          ]
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()

      expect(body.successful).toHaveLength(2)
      expect(body.failed).toHaveLength(0)
    })

    it('should handle partial failure in bulk variable creation', async () => {
      await variableService.createVariable(
        user1,
        {
          name: 'Bulk Conflicting Variable',
          note: 'Existing Var',
          entries: [{ value: 'x', environmentSlug: environment1.slug }]
        },
        project1.slug
      )
      const response = await app.inject({
        method: 'POST',
        url: `/variable/${project1.slug}/bulk`,
        payload: {
          variables: [
            {
              name: 'Bulk Conflicting Variable',
              note: 'duplicate note',
              entries: [{ value: 'v', environmentSlug: environment1.slug }]
            },
            {
              name: 'Bulk Unique Variable',
              note: 'unique note',
              entries: [{ value: 'unique', environmentSlug: environment1.slug }]
            }
          ]
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })
      expect(response.statusCode).toBe(201)
      const body = response.json()

      expect(body.successful.length).toBe(1)
      expect(body.failed.length).toBe(1)

      expect(body.failed[0].name).toBe('Bulk Conflicting Variable')
      expect(body.successful[0].variable.name).toBe('Bulk Unique Variable')
    })

    it('should reject bulk create if all variables are invalid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/variable/${project1.slug}/bulk`,
        payload: {
          variables: [
            {
              name: '',
              entries: [{ value: 'v', environmentSlug: environment1.slug }]
            },
            {
              name: '   ',
              entries: [{ value: 'v', environmentSlug: environment1.slug }]
            }
          ]
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(400)
    })

    it('should not be able to create variables if tier limit is reached', async () => {
      // Create variables until tier limit is reached
      for (
        let x = 100;
        x <
        100 + (await tierLimitService.getVariableTierLimit(project1.id)) - 1; // Subtract 1 for the variables created above
        x++
      ) {
        await variableService.createVariable(
          user1,
          {
            name: `Variable ${x}`,
            note: `Variable ${x} note`,
            entries: [
              {
                value: `Variable ${x} value`,
                environmentSlug: environment1.slug
              }
            ]
          },
          project1.slug
        )
      }

      const response = await app.inject({
        method: 'POST',
        url: `/variable/${project1.slug}`,
        payload: {
          name: 'Variable X',
          note: 'Variable X note',
          entries: [
            {
              value: 'Variable X value',
              environmentSlug: environment1.slug
            }
          ]
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(400)
    })

    it('should have created a variable version', async () => {
      const variableVersion = await prisma.variableVersion.findFirst({
        where: {
          variableId: variable1.id
        }
      })

      expect(variableVersion).toBeDefined()
      expect(variableVersion.value).toBe('Variable 1 value')
      expect(variableVersion.version).toBe(1)
    })

    it('should not be able to create variable with empty name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/variable/${project1.slug}`,
        payload: {
          name: ' '
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(400)

      const messages = response.json().message

      expect(messages).toHaveLength(1)
      expect(messages[0]).toEqual('name should not be empty')
    })

    it('should not be able to create a variable with a non-existing environment', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/variable/${project1.slug}`,
        payload: {
          name: 'Variable 3',
          rotateAfter: '24',
          entries: [
            {
              value: 'Variable 3 value',
              environmentSlug: 'non-existing-environment-slug'
            }
          ]
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to create a variable if the user has no access to the project', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/variable/${project1.slug}`,
        payload: {
          name: 'Variable 3',
          rotateAfter: '24'
        },
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to create a duplicate variable in the same project', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/variable/${project1.slug}`,
        payload: {
          name: 'Variable 1',
          rotateAfter: '24'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(409)
    })

    it('should have created a VARIABLE_ADDED event', async () => {
      const response = await fetchEvents(
        eventService,
        user1,
        workspace1.slug,
        EventSource.VARIABLE
      )

      const event = response.items[0]

      expect(event.source).toBe(EventSource.VARIABLE)
      expect(event.triggerer).toBe(EventTriggerer.USER)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.VARIABLE_ADDED)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBeDefined()
    })

    it('should not create a variable version entity if value-environmentSlug is not provided during creation', async () => {
      const variable = (await variableService.createVariable(
        user1,
        {
          name: 'Var 3',
          note: 'Var 3 note'
        },
        project1.slug
      )) as Variable

      const variableVersions = await prisma.variableVersion.findMany({
        where: {
          variableId: variable.id
        }
      })

      expect(variableVersions.length).toBe(0)
    })

    it('should not allow creating a variable when a secret with the same name exists', async () => {
      await secretService.createSecret(
        user1,
        {
          name: 'COLLIDE',
          entries: [{ environmentSlug: environment1.slug, value: 'foo' }]
        },
        project1.slug
      )

      const response = await app.inject({
        method: 'POST',
        url: `/variable/${project1.slug}`,
        payload: {
          name: 'COLLIDE',
          note: 'Collide Note',
          rotateAfter: '24',
          entries: [{ environmentSlug: environment1.slug, value: 'bar' }]
        },
        headers: { 'x-e2e-user-email': user1.email }
      })

      const body = response.json()

      expect(body.statusCode).toBe(409)

      const msg = JSON.parse(body.message)
      expect(msg.header).toBe('Secret already exists')
      expect(msg.body).toBe(
        `Secret COLLIDE already exists in project ${project1.slug}`
      )
    })
  })

  describe('Update Variable Tests', () => {
    it('should not be able to update a non-existing variable', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/non-existing-variable-slug`,
        payload: {
          name: 'Updated Variable 1',
          rotateAfter: '24'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to update variable with empty name', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}`,
        payload: {
          name: ' '
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(400)

      const messages = response.json().message

      expect(messages).toHaveLength(1)
      expect(messages[0]).toEqual('name should not be empty')
    })

    it('should not be able to update variable with empty name', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}`,
        payload: {
          name: ' '
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(400)

      const messages = response.json().message

      expect(messages).toHaveLength(1)
      expect(messages[0]).toEqual('name should not be empty')
    })

    it('should not be able to update a variable with same name in the same project', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}`,
        payload: {
          name: 'Variable 1',
          rotateAfter: '24'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(409)
    })

    it('should be able to update the variable name and note without creating a new version', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}`,
        payload: {
          name: 'Updated Variable 1',
          note: 'Updated Variable 1 note'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().variable.name).toEqual('Updated Variable 1')
      expect(response.json().variable.note).toEqual('Updated Variable 1 note')
      expect(response.json().slug).not.toBe(variable1.slug)
      expect(response.json().updatedVersions.length).toEqual(0)

      const variableVersion = await prisma.variableVersion.findMany({
        where: {
          variableId: variable1.id
        },
        include: {
          environment: true
        }
      })

      expect(variableVersion.length).toBe(1)
      expect(variableVersion[0].environment.id).toBe(environment1.id)
      expect(variableVersion[0].environment.slug).toBe(environment1.slug)
    })

    it('should create a new version if the value is updated', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}`,
        payload: {
          entries: [
            {
              value: 'Updated Variable 1 value',
              environmentSlug: environment1.slug
            }
          ]
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().updatedVersions.length).toEqual(1)

      const variableVersion = await prisma.variableVersion.findMany({
        where: {
          variableId: variable1.id,
          environmentId: environment1.id
        }
      })

      expect(variableVersion.length).toBe(2)
    })

    it('should fail to create a new version if the environment does not exist', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}`,
        payload: {
          entries: [
            {
              value: 'Updated Variable 1 value',
              environmentSlug: 'non-existing-environment-slug'
            }
          ]
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should have created a VARIABLE_UPDATED event', async () => {
      // Update a variable
      await variableService.updateVariable(user1, variable1.slug, {
        name: 'Updated Variable 1'
      })

      const response = await fetchEvents(
        eventService,
        user1,
        workspace1.slug,
        EventSource.VARIABLE
      )

      const event = response.items[0]

      expect(event.source).toBe(EventSource.VARIABLE)
      expect(event.triggerer).toBe(EventTriggerer.USER)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.VARIABLE_UPDATED)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBeDefined()
    })

    it('should not allow renaming a variable to a name that matches an existing secret', async () => {
      await secretService.createSecret(
        user1,
        {
          name: 'COLLIDE',
          entries: [{ environmentSlug: environment1.slug, value: 'foo' }]
        },
        project1.slug
      )

      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}`,
        payload: { name: 'COLLIDE' },
        headers: { 'x-e2e-user-email': user1.email }
      })

      const body = response.json()

      expect(body.statusCode).toBe(409)

      const msg = JSON.parse(body.message)
      expect(msg.header).toBe('Secret already exists')
      expect(msg.body).toBe(
        `Secret COLLIDE already exists in project ${project1.slug}`
      )
    })
  })

  describe('Delete Environment Value Of Variable Tests', () => {
    it('should be able to delete environment value of variable', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/variable/${variable1.slug}/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)

      const variableVersion = await prisma.variableVersion.findMany({
        where: {
          variableId: variable1.id,
          environmentId: environment1.id
        }
      })

      expect(variableVersion.length).toBe(0)
    })

    it('should not be able to delete environment value of variable it does not have access to', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/variable/${variable1.slug}/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to delete environment value of non-existing variable', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/variable/non-existing-variable-slug/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to delete environment value of variable it does not have access to', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/variable/${variable1.slug}/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Rollback Tests', () => {
    it('should not be able to roll back a non-existing variable', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/non-existing-variable-slug/rollback/1?environmentSlug=${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to roll back a variable it does not have access to', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}/rollback/1?environmentSlug=${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to roll back to a non-existing version', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}/rollback/2?environmentSlug=${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should be able to roll back a variable', async () => {
      // Creating a few versions first
      await variableService.updateVariable(user1, variable1.slug, {
        entries: [
          {
            value: 'Updated Variable 1 value',
            environmentSlug: environment1.slug
          }
        ]
      })

      await variableService.updateVariable(user1, variable1.slug, {
        entries: [
          {
            value: 'Updated Variable 1 value 2',
            environmentSlug: environment1.slug
          }
        ]
      })

      let versions: VariableVersion[]

      versions = await prisma.variableVersion.findMany({
        where: {
          variableId: variable1.id
        }
      })

      expect(versions.length).toBe(3)

      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}/rollback/1?environmentSlug=${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().count).toEqual(2)

      versions = await prisma.variableVersion.findMany({
        where: {
          variableId: variable1.id
        }
      })

      expect(versions.length).toBe(1)
    })

    it('should not be able to roll back if the variable has no versions', async () => {
      await prisma.variableVersion.deleteMany({
        where: {
          variableId: variable1.id
        }
      })

      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}/rollback/1?environmentSlug=${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('Get All Variables Of Project Tests', () => {
    it('should be able to fetch all variables', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/variable/${project1.slug}?page=0&limit=10`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().items.length).toBe(1)

      const { variable, values } = response.json().items[0]
      expect(variable).toBeDefined()
      expect(variable.versions).toBeUndefined()
      expect(values).toBeDefined()
      expect(values.length).toBe(1)
      expect(values[0].value).toBe('Variable 1 value')
      expect(values[0].version).toBe(1)
      expect(values[0].environment.id).toBe(environment1.id)
      expect(values[0].environment.slug).toBe(environment1.slug)
      expect(values[0].environment.name).toBe(environment1.name)
      expect(variable).toStrictEqual({
        id: variable1.id,
        name: variable1.name,
        slug: variable1.slug,
        note: variable1.note,
        projectId: project1.id,
        lastUpdatedById: variable1.lastUpdatedById,
        lastUpdatedBy: {
          id: user1.id,
          name: user1.name,
          profilePictureUrl: user1.profilePictureUrl
        },
        createdAt: variable1.createdAt.toISOString(),
        updatedAt: variable1.updatedAt.toISOString()
      })

      //check metadata
      const metadata = response.json().metadata
      expect(metadata.totalCount).toEqual(1)
      expect(metadata.links.self).toEqual(
        `/variable/${project1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.first).toEqual(
        `/variable/${project1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.previous).toBeNull()
      expect(metadata.links.next).toBeNull()
      expect(metadata.links.last).toEqual(
        `/variable/${project1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
    })

    it('should be able to fetch only new versions of variable', async () => {
      // update variable1
      await variableService.updateVariable(user1, variable1.slug, {
        entries: [
          {
            environmentSlug: environment1.slug,
            value: 'Variable 1 new value'
          }
        ]
      })

      const response = await app.inject({
        method: 'GET',
        url: `/variable/${project1.slug}?page=0&limit=10`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().items.length).toBe(1)

      const { variable, values } = response.json().items[0]
      expect(variable).toBeDefined()
      expect(variable.versions).toBeUndefined()
      expect(values).toBeDefined()
      expect(values.length).toBe(1)
      expect(values[0].value).toBe('Variable 1 new value')
      expect(values[0].version).toBe(2)
      expect(values[0].environment.id).toBe(environment1.id)
      expect(values[0].environment.slug).toBe(environment1.slug)
      expect(values[0].environment.name).toBe(environment1.name)

      expect(variable).toStrictEqual({
        id: variable1.id,
        name: variable1.name,
        slug: variable1.slug,
        note: variable1.note,
        projectId: project1.id,
        lastUpdatedById: variable1.lastUpdatedById,
        lastUpdatedBy: {
          id: user1.id,
          name: user1.name,
          profilePictureUrl: user1.profilePictureUrl
        },
        createdAt: variable1.createdAt.toISOString(),
        updatedAt: expect.any(String)
      })

      //check metadata
      const metadata = response.json().metadata
      expect(metadata.totalCount).toEqual(1)
      expect(metadata.links.self).toEqual(
        `/variable/${project1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.first).toEqual(
        `/variable/${project1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.previous).toBeNull()
      expect(metadata.links.next).toBeNull()
      expect(metadata.links.last).toEqual(
        `/variable/${project1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
    })

    it('should not be able to fetch all variables if the user has no access to the project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/variable/${project1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to fetch all variables if the project does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/variable/non-existing-project-slug`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('Delete Variable Tests', () => {
    it('should not be able to delete a non-existing variable', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/variable/non-existing-variable-slug`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to delete a variable it does not have access to', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/variable/${variable1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should be able to delete a variable', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/variable/${variable1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
    })

    it('should have created a VARIABLE_DELETED event', async () => {
      // Delete a variable
      await variableService.deleteVariable(user1, variable1.slug)

      const response = await fetchEvents(
        eventService,
        user1,
        workspace1.slug,
        EventSource.VARIABLE
      )

      const event = response.items[0]

      expect(event.source).toBe(EventSource.VARIABLE)
      expect(event.triggerer).toBe(EventTriggerer.USER)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.VARIABLE_DELETED)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBeDefined()
    })
  })

  describe('Revision Tests', () => {
    it('should be able to fetch all revisions of variables', async () => {
      // create two more entries,totalling three versions
      // checks if its able to fetch multiple revisions
      await variableService.updateVariable(user1, variable1.slug, {
        entries: [
          {
            value: 'Updated Variable 1 value',
            environmentSlug: environment1.slug
          }
        ]
      })

      await variableService.updateVariable(user1, variable1.slug, {
        entries: [
          {
            value: 'Updated variable 1 value 2',
            environmentSlug: environment1.slug
          }
        ]
      })

      const response = await app.inject({
        method: 'GET',
        url: `/variable/${variable1.slug}/revisions/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().items).toHaveLength(3)
    })

    it('should return [] if the variable has no revision', async () => {
      //returns [] if variable has no revision
      await prisma.variableVersion.deleteMany({
        where: {
          variableId: variable1.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: `/variable/${variable1.slug}/revisions/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().items).toHaveLength(0)
    })

    it('should return error if variable doesnt exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/variable/9999/revisions/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return error if environment does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/variable/${variable1.slug}/revisions/9999`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns error if variable is not accessible', async () => {
      //return error if user has no access to variable
      const response = await app.inject({
        method: 'GET',
        url: `/variable/${variable1.slug}/revisions/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Get All Variables By Project And Environment Tests', () => {
    it('should be able to fetch all variables by project and environment', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/variable/${project1.slug}/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().length).toBe(1)

      const variable = response.json()[0]
      expect(variable.name).toBe('Variable 1')
      expect(variable.value).toBe('Variable 1 value')
      expect(variable.isPlaintext).toBe(true)
    })

    it('should not be able to fetch all variables by project and environment if the user has no access to the project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/variable/${project1.slug}/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to fetch all variables by project and environment if the project does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/variable/non-existing-project-slug/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to fetch all variables by project and environment if the environment does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/variable/${project1.slug}/non-existing-environment-slug`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('Disable/Enable Variable Tests', () => {
    it('should not be able to disable a variable it does not have access to', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}/disable/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to enable a variable it does not have access to', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}/enable/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to disable a variable that does not exist', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/non-existent-variable-slug/disable/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to enable a variable that does not exist', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/non-existent-variable-slug/enable/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to disable a variable in an invalid environment', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}/disable/non-existent-environment-slug`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to enable a variable in an invalid environment', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}/enable/non-existent-environment-slug`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should be able to disable a variable', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}/disable/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)

      // Re-enabling variable for further tests
      await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}/enable/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })
    })

    it('should be able to enable a variable', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/variable/${variable1.slug}/enable/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('Fetch All Disabled Environments Of Variable Tests', () => {
    it('should not be able to fetch disabled environments of a non-existent variable', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/variable/non-existent-variable-slug/disabled`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to fetch disabled environments of a variable it does not have access to', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/variable/${variable1.slug}/disabled`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should be able to fetch disabled environments of a variable', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/variable/${variable1.slug}/disabled`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
    })
  })
})
