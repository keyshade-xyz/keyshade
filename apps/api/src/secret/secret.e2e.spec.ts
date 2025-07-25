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
  ProjectAccessLevel,
  Secret,
  SecretVersion,
  Workspace
} from '@prisma/client'
import { Test } from '@nestjs/testing'
import { AppModule } from '@/app/app.module'
import { EventModule } from '@/event/event.module'
import { WorkspaceModule } from '@/workspace/workspace.module'
import { ProjectModule } from '@/project/project.module'
import { EnvironmentModule } from '@/environment/environment.module'
import { SecretModule } from './secret.module'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
import { EnvironmentService } from '@/environment/environment.service'
import { SecretService } from './secret.service'
import { EventService } from '@/event/event.service'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { RedisClientType } from 'redis'
import { mockDeep } from 'jest-mock-extended'
import { UserService } from '@/user/user.service'
import { UserModule } from '@/user/user.module'
import { QueryTransformPipe } from '@/common/pipes/query.transform.pipe'
import { fetchEvents } from '@/common/event'
import { AuthenticatedUser } from '@/user/user.types'
import { ValidationPipe } from '@nestjs/common'
import { TierLimitService } from '@/common/tier-limit.service'
import { VariableModule } from '@/variable/variable.module'
import { VariableService } from '@/variable/variable.service'
import { randomBytes } from 'crypto'

describe('Secret Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let projectService: ProjectService
  let workspaceService: WorkspaceService
  let environmentService: EnvironmentService
  let secretService: SecretService
  let eventService: EventService
  let userService: UserService
  let tierLimitService: TierLimitService
  let variableService: VariableService

  let user1: AuthenticatedUser, user2: AuthenticatedUser
  let workspace1: Workspace
  let project1: Project, project2: Project
  let environment1: Environment
  let secret1: Secret

  const USER_IP_ADDRESS = '127.0.0.1'

  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: jest.fn().mockImplementation((array: Uint8Array) => {
        const randomValues = randomBytes(array.length)
        array.set(randomValues)
        return array
      })
    }
  })

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        EventModule,
        WorkspaceModule,
        ProjectModule,
        EnvironmentModule,
        SecretModule,
        UserModule,
        VariableModule
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
    secretService = moduleRef.get(SecretService)
    eventService = moduleRef.get(EventService)
    userService = moduleRef.get(UserService)
    tierLimitService = moduleRef.get(TierLimitService)
    variableService = moduleRef.get(VariableService)

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

    project2 = (await projectService.createProject(user1, workspace1.slug, {
      name: 'Project 2',
      description: 'Project 2 description',
      storePrivateKey: false,
      accessLevel: ProjectAccessLevel.PRIVATE,
      environments: [
        {
          name: 'Environment 1',
          description: 'Environment 1 description'
        }
      ]
    })) as Project

    environment1 = await prisma.environment.findFirst({
      where: {
        projectId: project1.id,
        name: 'Environment 1'
      }
    })

    secret1 = (
      await secretService.createSecret(
        user1,
        {
          name: 'Secret 1',
          rotateAfter: '24',
          note: 'Secret 1 note',
          entries: [
            {
              environmentSlug: environment1.slug,
              value: 'Secret 1 value'
            }
          ]
        },
        project1.slug
      )
    ).secret as Secret
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

  describe('Create Secret Tests', () => {
    it('should be able to create a secret', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/secret/${project1.slug}`,
        payload: {
          name: 'Secret 2',
          note: 'Secret 2 note',
          entries: [
            {
              value: 'Secret 2 value',
              environmentSlug: environment1.slug
            }
          ],
          rotateAfter: '24'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(201)

      const body = response.json()

      expect(body).toBeDefined()
      expect(body.secret.name).toBe('Secret 2')
      expect(body.secret.note).toBe('Secret 2 note')
      expect(body.secret.projectId).toBe(project1.id)
      expect(body.values.length).toBe(1)
      expect(body.values[0].value).not.toBe('Secret 2 value')
      expect(body.values[0].environment.id).toBe(environment1.id)
      expect(body.values[0].environment.slug).toBe(environment1.slug)
    })

    it('should have encrypted value if project does not store private key', async () => {
      // Make the project not store private key
      await prisma.project.update({
        where: {
          id: project1.id
        },
        data: {
          storePrivateKey: false,
          privateKey: null
        }
      })

      const response = await app.inject({
        method: 'POST',
        url: `/secret/${project1.slug}`,
        payload: {
          name: 'Secret 2',
          note: 'Secret 2 note',
          entries: [
            {
              value: 'Secret 2 value',
              environmentSlug: environment1.slug
            }
          ],
          rotateAfter: '24'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(201)

      const body = response.json()

      expect(body).toBeDefined()
      expect(body.secret.name).toBe('Secret 2')
      expect(body.secret.note).toBe('Secret 2 note')
      expect(body.secret.projectId).toBe(project1.id)
      expect(body.values.length).toBe(1)
      expect(body.values[0].value).not.toBe('Secret 2 value')
      expect(body.values[0].environment.id).toBe(environment1.id)
      expect(body.values[0].environment.slug).toBe(environment1.slug)
    })

    it('should bulk create multiple secrets successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/secret/${project1.slug}/bulk`,
        payload: {
          secrets: [
            {
              name: 'Bulk Secret 1',
              note: 'Bulk 1 note',
              entries: [{ value: 'v1', environmentSlug: environment1.slug }],
              rotateAfter: '24'
            },
            {
              name: 'Bulk Secret 2',
              note: 'Bulk 2 note',
              entries: [{ value: 'v2', environmentSlug: environment1.slug }],
              rotateAfter: '24'
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

    it('should handle partial failure in bulk secret creation', async () => {
      await secretService.createSecret(
        user1,
        {
          name: 'Duplicate Secret',
          entries: [{ environmentSlug: environment1.slug, value: 'foo' }],
          rotateAfter: '24'
        },
        project1.slug
      )

      const response = await app.inject({
        method: 'POST',
        url: `/secret/${project1.slug}/bulk`,
        payload: {
          secrets: [
            {
              name: 'New Secret',
              entries: [{ value: 'v1', environmentSlug: environment1.slug }],
              rotateAfter: '24'
            },
            {
              name: 'Duplicate Secret',
              entries: [{ value: 'v2', environmentSlug: environment1.slug }],
              rotateAfter: '24'
            }
          ]
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()

      expect(body.successful).toHaveLength(1)
      expect(body.failed).toHaveLength(1)
      expect(body.failed[0].name).toBe('Duplicate Secret')
    })

    it('should reject bulk create if all secrets are invalid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/secret/${project1.slug}/bulk`,
        payload: {
          secrets: [
            {
              name: ' ',
              rotateAfter: '24'
            }
          ]
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(400)
    })

    it('should not be able to create secrets if tier limit is reached', async () => {
      // Create secrets until tier limit is reached
      for (
        let x = 100;
        x < 100 + tierLimitService.getSecretTierLimit(project1.id) - 1; // Subtract 1 for the secrets created above
        x++
      ) {
        await secretService.createSecret(
          user1,
          {
            name: `Secret ${x}`,
            note: `Secret ${x} note`,
            entries: [
              {
                value: `Secret ${x} value`,
                environmentSlug: environment1.slug
              }
            ],
            rotateAfter: '24'
          },
          project1.slug
        )
      }

      const response = await app.inject({
        method: 'POST',
        url: `/secret/${project1.slug}`,
        payload: {
          name: 'Secret X',
          note: 'Secret X note',
          entries: [
            {
              value: 'Secret X value',
              environmentSlug: environment1.slug
            }
          ],
          rotateAfter: '24'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(400)
    }, 20000)

    it('should have created a secret version', async () => {
      const secretVersion = await prisma.secretVersion.findFirst({
        where: {
          secretId: secret1.id
        }
      })

      expect(secretVersion).toBeDefined()
      expect(secretVersion.value).not.toBe('Secret 1 value')
      expect(secretVersion.version).toBe(1)
      expect(secretVersion.environmentId).toBe(environment1.id)
    })

    it('should not be able to create secret with empty name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/secret/${project1.slug}`,
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

    it('should not be able to create a secret with a non-existing environment', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/secret/${project1.slug}`,
        payload: {
          name: 'Secret 3',
          rotateAfter: '24',
          entries: [
            {
              value: 'Secret 3 value',
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

    it('should not be able to create a secret if the user has no access to the project', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/secret/${project1.slug}`,
        payload: {
          name: 'Secret 3',
          rotateAfter: '24'
        },
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to create a duplicate secret in the same project', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/secret/${project1.slug}`,
        payload: {
          name: 'Secret 1',
          rotateAfter: '24'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(409)
    })

    it('should have created a SECRET_ADDED event', async () => {
      const response = await fetchEvents(
        eventService,
        user1,
        workspace1.slug,
        EventSource.SECRET
      )

      const event = response.items[0]

      expect(event.source).toBe(EventSource.SECRET)
      expect(event.triggerer).toBe(EventTriggerer.USER)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.SECRET_ADDED)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBeDefined()
    })

    it('should not allow creating a secret when a variable with the same name exists', async () => {
      await variableService.createVariable(
        user1,
        {
          name: 'COLLIDE',
          entries: [{ environmentSlug: environment1.slug, value: 'foo' }]
        },
        project1.slug
      )

      const response = await app.inject({
        method: 'POST',
        url: `/secret/${project1.slug}`,
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
      expect(msg.header).toBe('Variable already exists')
      expect(msg.body).toBe(
        `Variable COLLIDE already exists in project ${project1.slug}`
      )
    })
  })

  describe('Update Secret Tests', () => {
    it('should not be able to update a non-existing secret', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/non-existing-secret-slug`,
        payload: {
          name: 'Updated Secret 1',
          rotateAfter: '24'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to update secret with empty name', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}`,
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

    it('should be able to update the secret name and note without creating a new version', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}`,
        payload: {
          name: 'Updated Secret 1',
          note: 'Updated Secret 1 note'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().secret.name).toEqual('Updated Secret 1')
      expect(response.json().secret.note).toEqual('Updated Secret 1 note')
      expect(response.json().updatedVersions.length).toBe(0)

      const secretVersion = await prisma.secretVersion.findMany({
        where: {
          secretId: secret1.id
        },
        include: {
          environment: true
        }
      })

      expect(secretVersion.length).toBe(1)
      expect(secretVersion[0].environment.id).toBe(environment1.id)
      expect(secretVersion[0].environment.slug).toBe(environment1.slug)
    })

    it('should create a new version if the value is updated', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}`,
        payload: {
          entries: [
            {
              value: 'Updated Secret 1 value',
              environmentSlug: environment1.slug
            }
          ]
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().updatedVersions.length).toBe(1)
      expect(response.json().updatedVersions[0].value).not.toBe(
        'Updated Secret 1 value'
      )

      const secretVersion = await prisma.secretVersion.findMany({
        where: {
          secretId: secret1.id,
          environmentId: environment1.id
        },
        include: {
          environment: true
        }
      })

      expect(secretVersion.length).toBe(2)
    })

    it('should have encrypted values after new version creation if project does not store private key', async () => {
      // Make the project not store private key
      await prisma.project.update({
        where: {
          id: project1.id
        },
        data: {
          storePrivateKey: false,
          privateKey: null
        }
      })

      const response = await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}`,
        payload: {
          entries: [
            {
              value: 'Updated Secret 1 value',
              environmentSlug: environment1.slug
            }
          ]
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().updatedVersions.length).toBe(1)
      expect(response.json().updatedVersions[0].value).not.toBe(
        'Updated Secret 1 value'
      )

      const secretVersion = await prisma.secretVersion.findMany({
        where: {
          secretId: secret1.id,
          environmentId: environment1.id
        },
        include: {
          environment: true
        }
      })

      expect(secretVersion.length).toBe(2)
    })

    it('should fail to create a new version if the environment does not exist', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}`,
        payload: {
          entries: [
            {
              value: 'Updated Secret 1 value',
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

    it('should have created a SECRET_UPDATED event', async () => {
      // Update a secret
      await secretService.updateSecret(user1, secret1.slug, {
        name: 'Updated Secret 1'
      })

      const response = await fetchEvents(
        eventService,
        user1,
        workspace1.slug,
        EventSource.SECRET
      )

      const event = response.items[0]

      expect(event.source).toBe(EventSource.SECRET)
      expect(event.triggerer).toBe(EventTriggerer.USER)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.SECRET_UPDATED)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBe(secret1.id)
    })

    it('should not allow renaming a secret to a name that matches an existing variable', async () => {
      await variableService.createVariable(
        user1,
        {
          name: 'COLLIDE',
          entries: [{ environmentSlug: environment1.slug, value: 'foo' }]
        },
        project1.slug
      )

      const response = await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}`,
        payload: { name: 'COLLIDE' },
        headers: { 'x-e2e-user-email': user1.email }
      })

      const body = response.json()

      expect(body.statusCode).toBe(409)

      const msg = JSON.parse(body.message)
      expect(msg.header).toBe('Variable already exists')
      expect(msg.body).toBe(
        `Variable COLLIDE already exists in project ${project1.slug}`
      )
    })
  })

  describe('Rollback Tests', () => {
    it('should not be able to roll back a non-existing secret', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/non-existing-secret-slug/rollback/1?environmentSlug=${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to roll back a secret it does not have access to', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}/rollback/1?environmentSlug=${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to roll back to a non-existing version', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}/rollback/2?environmentSlug=${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to roll back if the secret has no versions', async () => {
      await prisma.secretVersion.deleteMany({
        where: {
          secretId: secret1.id
        }
      })

      const response = await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}/rollback/1?environmentSlug=${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not create a secret version entity if value-environmentSlug is not provided during creation', async () => {
      const secret = (
        await secretService.createSecret(
          user1,
          {
            name: 'Secret 4',
            note: 'Secret 4 note',
            rotateAfter: '24'
          },
          project1.slug
        )
      ).secret

      const secretVersion = await prisma.secretVersion.findMany({
        where: {
          secretId: secret.id
        }
      })

      expect(secretVersion.length).toBe(0)
    })

    it('should be able to roll back a secret', async () => {
      // Creating a few versions first
      await secretService.updateSecret(user1, secret1.slug, {
        entries: [
          {
            value: 'Updated Secret 1 value',
            environmentSlug: environment1.slug
          }
        ]
      })

      await secretService.updateSecret(user1, secret1.slug, {
        entries: [
          {
            value: 'Updated Secret 1 value 2',
            environmentSlug: environment1.slug
          }
        ]
      })

      let versions: SecretVersion[]

      // eslint-disable-next-line prefer-const
      versions = await prisma.secretVersion.findMany({
        where: {
          secretId: secret1.id
        }
      })

      expect(versions.length).toBe(3)

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}/rollback/1?environmentSlug=${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      // expect(response.json().count).toEqual(2)

      // versions = await prisma.secretVersion.findMany({
      //   where: {
      //     secretId: secret1.id
      //   }
      // })

      // expect(versions.length).toBe(1)
    })
  })

  describe('Get All Secrets By Project Tests', () => {
    it('should be able to fetch all secrets', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/secret/${project1.slug}?page=0&limit=10`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().items.length).toBe(1)

      const { secret, values } = response.json().items[0]
      expect(secret).toStrictEqual({
        id: secret1.id,
        name: secret1.name,
        slug: secret1.slug,
        note: secret1.note,
        projectId: project1.id,
        lastUpdatedById: secret1.lastUpdatedById,
        lastUpdatedBy: {
          id: user1.id,
          name: user1.name,
          profilePictureUrl: user1.profilePictureUrl
        },
        createdAt: secret1.createdAt.toISOString(),
        updatedAt: secret1.updatedAt.toISOString(),
        rotateAfter: secret1.rotateAfter,
        rotateAt: secret1.rotateAt.toISOString()
      })
      expect(values.length).toBe(1)

      const value = values[0]
      expect(value.version).toBe(1)
      expect(value.environment.id).toBe(environment1.id)
      expect(value.environment.slug).toBe(environment1.slug)
      expect(value.environment.name).toBe(environment1.name)
      expect(value.value).not.toEqual('Secret 1 value')

      //check metadata
      const metadata = response.json().metadata
      expect(metadata.totalCount).toEqual(1)
      expect(metadata.links.self).toEqual(
        `/secret/${project1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.first).toEqual(
        `/secret/${project1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.previous).toBeNull()
      expect(metadata.links.next).toBeNull()
      expect(metadata.links.last).toEqual(
        `/secret/${project1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
    })

    it('should be able to fetch only new versions of secrets', async () => {
      // Update secret1
      await secretService.updateSecret(user1, secret1.slug, {
        entries: [
          {
            value: 'Secret new 1 value',
            environmentSlug: environment1.slug
          }
        ]
      })

      const response = await app.inject({
        method: 'GET',
        url: `/secret/${project1.slug}?page=0&limit=10`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().items.length).toBe(1)

      const { secret, values } = response.json().items[0]

      expect(secret).toStrictEqual({
        id: secret1.id,
        name: secret1.name,
        slug: secret1.slug,
        note: secret1.note,
        projectId: project1.id,
        lastUpdatedById: secret1.lastUpdatedById,
        lastUpdatedBy: {
          id: user1.id,
          name: user1.name,
          profilePictureUrl: user1.profilePictureUrl
        },
        createdAt: secret1.createdAt.toISOString(),
        updatedAt: expect.any(String),
        rotateAfter: secret1.rotateAfter,
        rotateAt: secret1.rotateAt.toISOString()
      })
      expect(values.length).toBe(1)

      const value = values[0]
      expect(value.version).toBe(2)
      expect(value.environment.id).toBe(environment1.id)
      expect(value.environment.slug).toBe(environment1.slug)
      expect(value.environment.name).toBe(environment1.name)
      expect(value.value).not.toEqual('Secret 1 new value')

      //check metadata
      const metadata = response.json().metadata
      expect(metadata.totalCount).toEqual(1)
      expect(metadata.links.self).toEqual(
        `/secret/${project1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.first).toEqual(
        `/secret/${project1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.previous).toBeNull()
      expect(metadata.links.next).toBeNull()
      expect(metadata.links.last).toEqual(
        `/secret/${project1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
    })

    it('should not be able to fetch all secrets if the user has no access to the project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/secret/${project1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to fetch all secrets if the project does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/secret/non-existing-project-slug`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('Delete Secret Tests', () => {
    it('should not be able to delete a non-existing secret', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/secret/non-existing-secret-slug`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to delete a secret it does not have access to', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/secret/${secret1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should be able to delete a secret', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/secret/${secret1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
    })

    it('should have created a SECRET_DELETED event', async () => {
      // Delete a secret
      await secretService.deleteSecret(user1, secret1.slug)

      const response = await fetchEvents(
        eventService,
        user1,
        workspace1.slug,
        EventSource.SECRET
      )

      const event = response.items[0]

      expect(event.source).toBe(EventSource.SECRET)
      expect(event.triggerer).toBe(EventTriggerer.USER)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.SECRET_DELETED)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBe(secret1.id)
    })
  })

  describe('Revisions Tests', () => {
    it('should be able to fetch all revisions of secrets', async () => {
      // create two more entries,totalling three versions
      // checks if its able to fetch multiple revisions
      await secretService.updateSecret(user1, secret1.slug, {
        entries: [
          {
            value: 'Updated Secret 1 value',
            environmentSlug: environment1.slug
          }
        ]
      })

      await secretService.updateSecret(user1, secret1.slug, {
        entries: [
          {
            value: 'Updated Secret 1 value 2',
            environmentSlug: environment1.slug
          }
        ]
      })

      const response = await app.inject({
        method: 'GET',
        url: `/secret/${secret1.slug}/revisions/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().items).toHaveLength(3)
    })

    it('should return [] if the secret has no revision', async () => {
      //returns [] if secret has no revision
      await prisma.secretVersion.deleteMany({
        where: {
          secretId: secret1.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: `/secret/${secret1.slug}/revisions/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().items).toHaveLength(0)
    })

    it('should return error if secret does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/secret/9999/revisions/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return error if environment does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/secret/${secret1.slug}/revisions/9999`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns error if secret is not accessible', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/secret/${secret1.slug}/revisions/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Rotate Secrets Tests', () => {
    it('should have not created a new secret version when there is no rotation defined', async () => {
      const secretWithoutRotation = (
        await secretService.createSecret(
          user1,
          {
            name: 'Secret',
            note: 'Secret note',
            rotateAfter: 'never',
            entries: [
              {
                environmentSlug: environment1.slug,
                value: 'Secret value'
              }
            ]
          },
          project1.slug
        )
      ).secret as Secret

      await secretService.rotateSecrets()

      const secretVersion = await prisma.secretVersion.findFirst({
        where: {
          secretId: secretWithoutRotation.id,
          environmentId: environment1.id
        },
        orderBy: {
          version: 'desc'
        },
        take: 1
      })

      expect(secretVersion).toBeDefined()
      expect(secretVersion.version).toBe(1)
      expect(secretVersion.environmentId).toBe(environment1.id)
    })

    it('should have not created a new secret version when rotation is not due', async () => {
      await secretService.rotateSecrets()

      const secretVersion = await prisma.secretVersion.findFirst({
        where: {
          secretId: secret1.id,
          environmentId: environment1.id
        },
        orderBy: {
          version: 'desc'
        },
        take: 1
      })

      expect(secretVersion).toBeDefined()
      expect(secretVersion.version).toBe(1)
      expect(secretVersion.environmentId).toBe(environment1.id)
    })

    it('should have created a new secret version when rotation is due', async () => {
      const currentTime = new Date()

      currentTime.setHours(currentTime.getHours() + secret1.rotateAfter)

      await secretService.rotateSecrets(currentTime)

      const secretVersion = await prisma.secretVersion.findFirst({
        where: {
          secretId: secret1.id,
          environmentId: environment1.id
        },
        orderBy: {
          version: 'desc'
        },
        take: 1
      })

      expect(secretVersion).toBeDefined()
      expect(secretVersion.version).toBe(2)
      expect(secretVersion.environmentId).toBe(environment1.id)
    })

    it('should have created a SECRET_UPDATED event when rotation is due', async () => {
      const currentTime = new Date()

      currentTime.setHours(currentTime.getHours() + secret1.rotateAfter)

      await secretService.rotateSecrets(currentTime)

      const events = await fetchEvents(
        eventService,
        user1,
        workspace1.slug,
        EventSource.SECRET
      )

      const event = events.items[0]

      expect(event.source).toBe(EventSource.SECRET)
      expect(event.triggerer).toBe(EventTriggerer.SYSTEM)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.SECRET_UPDATED)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBe(secret1.id)
      expect(event.title).toBe('Secret rotated')
    })
  })

  describe('Fetch All Secrets By Project And Environment Tests', () => {
    it('should be able to fetch all secrets by project and environment', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/secret/${project1.slug}/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().length).toBe(1)

      const secret = response.json()[0]
      expect(secret.name).toBe('Secret 1')
      expect(secret.value).not.toBe('Secret 1 value')
    })

    it('should not be able to fetch all secrets by project and environment if project does not exists', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/secret/non-existing-project-slug/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to fetch all secrets by project and environment if environment does not exists', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/secret/${project1.slug}/non-existing-environment-slug`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to fetch all secrets by project and environment if the user has no access to the project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/secret/${project1.slug}/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be sending the plaintext secret if project does not store the private key', async () => {
      // Get the first environment of project 2
      const environment = await prisma.environment.findFirst({
        where: {
          projectId: project2.id
        }
      })

      // Create a secret in project 2
      await secretService.createSecret(
        user1,
        {
          name: 'Secret 20',
          entries: [
            {
              environmentSlug: environment.slug,
              value: 'Secret 20 value'
            }
          ],
          rotateAfter: '24',
          note: 'Secret 20 note'
        },
        project2.slug
      )

      const response = await app.inject({
        method: 'GET',
        url: `/secret/${project2.slug}/${environment.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().length).toBe(1)

      const secret = response.json()[0]
      expect(secret.name).toBe('Secret 20')
      expect(secret.value).not.toBe('Secret 20 value')
    })
  })

  describe('Disable/Enable Secret Tests', () => {
    it('should not be able to disable a secret it does not have access to', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}/disable/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to enable a secret it does not have access to', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}/enable/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to disable a secret that does not exist', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/non-existent-secret-slug/disable/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to enable a secret that does not exist', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/non-existent-secret-slug/enable/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to disable a secret in an invalid environment', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}/disable/non-existent-environment-slug`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to enable a secret in an invalid environment', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}/enable/non-existent-environment-slug`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should be able to disable a secret', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}/disable/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)

      // Re-enabling secret for further tests
      await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}/enable/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })
    })

    it('should be able to enable a secret', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/secret/${secret1.slug}/enable/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('Fetch All Disabled Environments Of Secret Tests', () => {
    it('should not be able to fetch disabled environments of a non-existent secret', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/secret/non-existent-secret-slug/disabled`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to fetch disabled environments of a secret it does not have access to', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/secret/${secret1.slug}/disabled`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should be able to fetch disabled environments of a secret', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/secret/${secret1.slug}/disabled`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
    })
  })
})
