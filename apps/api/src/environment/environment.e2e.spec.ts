import { Test } from '@nestjs/testing'
import { AppModule } from '@/app/app.module'
import { EnvironmentModule } from './environment.module'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { PrismaService } from '@/prisma/prisma.service'
import {
  Environment,
  EventSeverity,
  EventSource,
  EventTriggerer,
  EventType,
  Project,
  ProjectAccessLevel,
  Workspace
} from '@prisma/client'
import { ProjectModule } from '@/project/project.module'
import { ProjectService } from '@/project/project.service'
import { EventModule } from '@/event/event.module'
import { EventService } from '@/event/event.service'
import { EnvironmentService } from './environment.service'
import { UserModule } from '@/user/user.module'
import { UserService } from '@/user/user.service'
import { QueryTransformPipe } from '@/common/pipes/query.transform.pipe'
import { fetchEvents } from '@/common/event'
import { ValidationPipe } from '@nestjs/common'
import { SecretModule } from '@/secret/secret.module'
import { VariableModule } from '@/variable/variable.module'
import { AuthenticatedUser } from '@/user/user.types'
import { TierLimitService } from '@/common/tier-limit.service'

describe('Environment Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let projectService: ProjectService
  let environmentService: EnvironmentService
  let userService: UserService
  let eventService: EventService
  // let secretService: SecretService
  // let variableService: VariableService
  let tierLimitService: TierLimitService

  let user1: AuthenticatedUser, user2: AuthenticatedUser
  let workspace1: Workspace
  let project1: Project
  let environment1: Environment, environment2: Environment

  const USER_IP_ADDRESS = '127.0.0.1'

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        EventModule,
        ProjectModule,
        EnvironmentModule,
        UserModule,
        SecretModule,
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
    projectService = moduleRef.get(ProjectService)
    eventService = moduleRef.get(EventService)
    environmentService = moduleRef.get(EnvironmentService)
    userService = moduleRef.get(UserService)
    // secretService = moduleRef.get(SecretService)
    // variableService = moduleRef.get(VariableService)
    tierLimitService = moduleRef.get(TierLimitService)

    app.useGlobalPipes(new ValidationPipe(), new QueryTransformPipe())

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
      environments: [
        {
          name: 'Environment 1',
          description: 'Environment 1 description'
        },
        {
          name: 'Environment 2',
          description: 'Environment 2 description'
        }
      ],
      accessLevel: ProjectAccessLevel.PRIVATE
    })) as Project

    environment1 = await prisma.environment.findUnique({
      where: {
        projectId_name: {
          projectId: project1.id,
          name: 'Environment 1'
        }
      }
    })

    environment2 = await prisma.environment.findUnique({
      where: {
        projectId_name: {
          projectId: project1.id,
          name: 'Environment 2'
        }
      }
    })
  })

  afterEach(async () => {
    await prisma.$transaction([
      prisma.user.deleteMany(),
      prisma.workspace.deleteMany()
    ])
  })

  it('should be defined', () => {
    expect(app).toBeDefined()
    expect(prisma).toBeDefined()
    expect(projectService).toBeDefined()
    expect(environmentService).toBeDefined()
    expect(userService).toBeDefined()
    expect(eventService).toBeDefined()
  })

  describe('Create Environment Tests', () => {
    it('should be able to create an environment under a project', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/environment/${project1.slug}`,
        payload: {
          name: 'Environment 3',
          description: 'Environment 3 description'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(201)
      expect(response.json().name).toBe('Environment 3')
      expect(response.json().description).toBe('Environment 3 description')
      expect(response.json().slug).toBeDefined()

      const environmentFromDb = await prisma.environment.findUnique({
        where: {
          id: response.json().id
        }
      })

      expect(environmentFromDb).toBeDefined()
    })

    it('should not be able to create more environments if tier limit is reached', async () => {
      // Create the number of environments that the tier limit allows
      for (
        let x = 100;
        x <
        100 + (await tierLimitService.getEnvironmentTierLimit(project1.id)) - 2; // Subtract 2 for the environments created above
        x++
      ) {
        await environmentService.createEnvironment(
          user1,
          {
            name: `Environment ${x}`,
            description: `Environment ${x} description`
          },
          project1.slug
        )
      }

      const response = await app.inject({
        method: 'POST',
        url: `/environment/${project1.slug}`,
        payload: {
          name: 'Environment X',
          description: 'Environment 101 description'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(400)
    })

    it('should not be able to create an environment with an empty name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/environment/${project1.slug}`,
        payload: {
          name: '',
          description: 'Empty name test'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().message[0]).toContain(
        'name must be longer than or equal to 3 characters'
      )
    })

    it('should not be able to create an environment in a project that does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/environment/123`,
        payload: {
          name: 'Environment 1',
          description: 'Environment 1 description'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to create an environment in a project that the user does not have access to', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/environment/${project1.slug}`,
        payload: {
          name: 'Environment 1',
          description: 'Environment 1 description'
        },
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to create a duplicate environment', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/environment/${project1.slug}`,
        payload: {
          name: 'Environment 1',
          description: 'Environment 1 description'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(409)
    })

    it('should have created a ENVIRONMENT_ADDED event', async () => {
      // Create an environment
      await environmentService.createEnvironment(
        user1,
        {
          name: 'Environment 4'
        },
        project1.slug
      )

      const response = await fetchEvents(
        eventService,
        user1,
        workspace1.slug,
        EventSource.ENVIRONMENT
      )

      const event = response.items[0]

      expect(event.source).toBe(EventSource.ENVIRONMENT)
      expect(event.triggerer).toBe(EventTriggerer.USER)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.ENVIRONMENT_ADDED)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBeDefined()
    })
  })

  describe('Update Environment Tests', () => {
    it('should be able to update an environment', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/environment/${environment1.slug}`,
        payload: {
          name: 'Environment 1 Updated',
          description: 'Environment 1 description updated'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        id: environment1.id,
        name: 'Environment 1 Updated',
        slug: expect.any(String),
        description: 'Environment 1 description updated',
        projectId: project1.id,
        lastUpdatedById: user1.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })

      environment1 = response.json()
    })

    it('should update the slug if name is updated', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/environment/${environment1.slug}`,
        payload: {
          name: 'Environment 1 Updated'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().slug).toBeDefined()
      expect(response.json().slug).not.toBe(environment1.slug)
    })

    it('should not be able to update an environment that does not exist', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/environment/123`,
        payload: {
          name: 'Environment 1 Updated',
          description: 'Environment 1 description updated'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to update an environment that the user does not have access to', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/environment/${environment1.slug}`,
        payload: {
          name: 'Environment 1 Updated',
          description: 'Environment 1 description updated'
        },
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to update an environment to a duplicate name', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/environment/${environment1.slug}`,
        payload: {
          name: 'Environment 2',
          description: 'Environment 1 description updated'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(409)
    })

    it('should create a ENVIRONMENT_UPDATED event', async () => {
      // Update an environment
      await environmentService.updateEnvironment(
        user1,
        {
          name: 'Environment 1 Updated'
        },
        environment1.slug
      )

      const response = await fetchEvents(
        eventService,
        user1,
        workspace1.slug,
        EventSource.ENVIRONMENT
      )

      const event = response.items[0]

      expect(event.source).toBe(EventSource.ENVIRONMENT)
      expect(event.triggerer).toBe(EventTriggerer.USER)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.ENVIRONMENT_UPDATED)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBeDefined()
    })
  })

  describe('Get Environment Tests', () => {
    it('should be able to fetch an environment', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/environment/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().name).toBe('Environment 1')
      expect(response.json().slug).toBe(environment1.slug)
      expect(response.json().description).toBe('Environment 1 description')
    })

    it('should not be able to fetch an environment that does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/environment/123`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to fetch an environment that the user does not have access to', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/environment/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Get All Environments Tests', () => {
    it('should be able to fetch all environments of a project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/environment/all/${project1.slug}?page=0&limit=10`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      // Check metadata
      const metadata = response.json().metadata
      expect(metadata.totalCount).toEqual(2)
      expect(metadata.links.self).toBe(
        `/environment/all/${project1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.first).toBe(
        `/environment/all/${project1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.previous).toBeNull()
      expect(metadata.links.next).toBeNull()
      expect(metadata.links.last).toBe(
        `/environment/all/${project1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
    })

    // it('should be able to get the count of secrets and variables in an environment', async () => {
    //   // Add secrets to the environment
    //   const secret1 = await secretService.createSecret(
    //     user1,
    //     {
    //       name: 'Secret 1',
    //       entries: [
    //         {
    //           value: 'Secret 1 value',
    //           environmentSlug: environment1.slug
    //         }
    //       ]
    //     },
    //     project1.slug
    //   )
    //   await secretService.createSecret(
    //     user1,
    //     {
    //       name: 'Secret 2',
    //       entries: [
    //         {
    //           value: 'Secret 2 value',
    //           environmentSlug: environment1.slug
    //         }
    //       ]
    //     },
    //     project1.slug
    //   )

    //   // Add variables to the environment
    //   const variable1 = await variableService.createVariable(
    //     user1,
    //     {
    //       name: 'Variable 1',
    //       entries: [
    //         {
    //           value: 'Variable 1 value',
    //           environmentSlug: environment1.slug
    //         }
    //       ]
    //     },
    //     project1.slug
    //   )
    //   await variableService.createVariable(
    //     user1,
    //     {
    //       name: 'Variable 2',
    //       entries: [
    //         {
    //           value: 'Variable 2 value',
    //           environmentSlug: environment1.slug
    //         }
    //       ]
    //     },
    //     project1.slug
    //   )

    //   // Update the value of a secret to add a SecretVersion
    //   await secretService.updateSecret(user1, secret1.secret.slug, {
    //     entries: [
    //       {
    //         value: 'Updated Secret 1 value',
    //         environmentSlug: environment1.slug
    //       }
    //     ]
    //   })

    //   // Update the value of a variable to add a VariableVersion
    //   await variableService.updateVariable(user1, variable1.variable.slug, {
    //     entries: [
    //       {
    //         value: 'Updated Variable 1 value',
    //         environmentSlug: environment1.slug
    //       }
    //     ]
    //   })

    //   const response = await app.inject({
    //     method: 'GET',
    //     url: `/environment/all/${project1.slug}?page=0&limit=10`,
    //     headers: {
    //       'x-e2e-user-email': user1.email
    //     }
    //   })

    //   expect(response.statusCode).toBe(200)
    //   const devEnvironment = response
    //     .json()
    //     .items.find((env: Environment) => env.slug === environment1.slug)

    //   expect(devEnvironment.secrets).toBe(2)
    //   expect(devEnvironment.variables).toBe(2)
    // })

    it('should not be able to fetch all environments of a project that does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/environment/all/123`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to fetch all environments of a project that the user does not have access to', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/environment/all/${project1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Delete Environment Tests', () => {
    it('should be able to delete an environment', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/environment/${environment2.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
    })

    it('should have created a ENVIRONMENT_DELETED event', async () => {
      // Delete an environment
      await environmentService.deleteEnvironment(user1, environment2.slug)

      const response = await fetchEvents(
        eventService,
        user1,
        workspace1.slug,
        EventSource.ENVIRONMENT
      )

      const event = response.items[0]

      expect(event.source).toBe(EventSource.ENVIRONMENT)
      expect(event.triggerer).toBe(EventTriggerer.USER)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.ENVIRONMENT_DELETED)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBeDefined()
    })

    it('should not be able to delete an environment that does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/environment/123`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to delete an environment that the user does not have access to', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/environment/${environment2.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to delete the only environment in a project', async () => {
      // Delete the other environment
      await environmentService.deleteEnvironment(user1, environment2.slug)

      const response = await app.inject({
        method: 'DELETE',
        url: `/environment/${environment1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(400)
    })
  })
})
