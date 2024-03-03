import { Test } from '@nestjs/testing'
import { AppModule } from '../app/app.module'
import { EnvironmentModule } from './environment.module'
import { MAIL_SERVICE } from '../mail/services/interface.service'
import { MockMailService } from '../mail/services/mock.service'
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { PrismaService } from '../prisma/prisma.service'
import cleanUp from '../common/cleanup'
import {
  Environment,
  EventSeverity,
  EventSource,
  EventTriggerer,
  EventType,
  Project,
  User,
  Workspace
} from '@prisma/client'
import { v4 } from 'uuid'
import fetchEvents from '../common/fetch-events'
import { ProjectModule } from '../project/project.module'
import { WorkspaceService } from '../workspace/service/workspace.service'
import { ProjectService } from '../project/service/project.service'
import { EventModule } from '../event/event.module'
import { WorkspaceModule } from '../workspace/workspace.module'

describe('Environment Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let projectService: ProjectService
  let workspaceService: WorkspaceService

  let user1: User, user2: User
  let workspace1: Workspace
  let project1: Project
  let environment1: Environment, environment2: Environment

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        EventModule,
        WorkspaceModule,
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
    projectService = moduleRef.get(ProjectService)
    workspaceService = moduleRef.get(WorkspaceService)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()

    await cleanUp(prisma)

    const user1Id = v4()
    const user2Id = v4()

    user1 = await prisma.user.create({
      data: {
        id: user1Id,
        email: 'johndoe@keyshade.xyz',
        name: 'John Doe',
        isOnboardingFinished: true
      }
    })

    user2 = await prisma.user.create({
      data: {
        id: user2Id,
        email: 'janedoe@keyshade.xyz',
        name: 'Jane Doe',
        isOnboardingFinished: true
      }
    })

    workspace1 = await workspaceService.createWorkspace(user1, {
      name: 'Workspace 1',
      description: 'Workspace 1 description',
      approvalEnabled: false
    })

    project1 = (await projectService.createProject(
      user1,
      workspace1.id,
      {
        name: 'Project 1',
        description: 'Project 1 description',
        storePrivateKey: true,
        environments: [],
        isPublic: false
      },
      ''
    )) as Project
  })

  it('should be defined', () => {
    expect(app).toBeDefined()
    expect(prisma).toBeDefined()
  })

  // it('should be able to create an environment under a project', async () => {
  //   const response = await app.inject({
  //     method: 'POST',
  //     url: `/environment/${project1.id}`,
  //     payload: {
  //       name: 'Environment 1',
  //       description: 'Environment 1 description',
  //       isDefault: true
  //     },
  //     headers: {
  //       'x-e2e-user-email': user1.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(201)
  //   expect(response.json()).toEqual({
  //     id: expect.any(String),
  //     name: 'Environment 1',
  //     description: 'Environment 1 description',
  //     isDefault: true,
  //     projectId: project1.id,
  //     lastUpdatedById: user1.id,
  //     createdAt: expect.any(String),
  //     updatedAt: expect.any(String)
  //   })

  //   environment1 = response.json()
  // })

  // it('should ensure there is only one default environment per project', async () => {
  //   const environments = await prisma.environment.findMany({
  //     where: {
  //       projectId: project1.id
  //     }
  //   })

  //   expect(environments.length).toBe(2)
  //   expect(environments.filter((e) => e.isDefault).length).toBe(1)
  // })

  // it('should not be able to create an environment in a project that does not exist', async () => {
  //   const response = await app.inject({
  //     method: 'POST',
  //     url: `/environment/123`,
  //     payload: {
  //       name: 'Environment 1',
  //       description: 'Environment 1 description',
  //       isDefault: true
  //     },
  //     headers: {
  //       'x-e2e-user-email': user1.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(404)
  //   expect(response.json().message).toBe('Project with id 123 not found')
  // })

  // it('should not be able to create an environment in a project that the user does not have access to', async () => {
  //   const response = await app.inject({
  //     method: 'POST',
  //     url: `/environment/${project1.id}`,
  //     payload: {
  //       name: 'Environment 1',
  //       description: 'Environment 1 description',
  //       isDefault: true
  //     },
  //     headers: {
  //       'x-e2e-user-email': user2.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(401)
  //   expect(response.json().message).toBe(
  //     `User with id ${user2.id} does not have the authority in the project with id ${project1.id}`
  //   )
  // })

  // it('should not be able to create a duplicate environment', async () => {
  //   const response = await app.inject({
  //     method: 'POST',
  //     url: `/environment/${project1.id}`,
  //     payload: {
  //       name: 'Environment 1',
  //       description: 'Environment 1 description',
  //       isDefault: true
  //     },
  //     headers: {
  //       'x-e2e-user-email': user1.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(409)
  //   expect(response.json().message).toBe(
  //     `Environment with name Environment 1 already exists in project ${project1.name} (${project1.id})`
  //   )
  // })

  // it('should not make other environments non-default if the current environment is not the default one', async () => {
  //   const response = await app.inject({
  //     method: 'POST',
  //     url: `/environment/${project1.id}`,
  //     payload: {
  //       name: 'Environment 2',
  //       description: 'Environment 2 description',
  //       isDefault: false
  //     },
  //     headers: {
  //       'x-e2e-user-email': user1.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(201)
  //   expect(response.json().name).toBe('Environment 2')
  //   expect(response.json().description).toBe('Environment 2 description')
  //   expect(response.json().isDefault).toBe(false)

  //   environment2 = response.json()

  //   const environments = await prisma.environment.findMany({
  //     where: {
  //       projectId: project1.id
  //     }
  //   })

  //   expect(environments.length).toBe(3)
  //   expect(environments.filter((e) => e.isDefault).length).toBe(1)
  // })

  // it('should have created a ENVIRONMENT_ADDED event', async () => {
  //   const response = await fetchEvents(
  //     app,
  //     user1,
  //     'environmentId=' + environment1.id
  //   )

  //   const event = {
  //     id: expect.any(String),
  //     title: expect.any(String),
  //     description: expect.any(String),
  //     source: EventSource.ENVIRONMENT,
  //     triggerer: EventTriggerer.USER,
  //     severity: EventSeverity.INFO,
  //     type: EventType.ENVIRONMENT_ADDED,
  //     timestamp: expect.any(String),
  //     metadata: expect.any(Object)
  //   }

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json()).toEqual(expect.arrayContaining([event]))
  // })

  // it('should be able to update an environment', async () => {
  //   const response = await app.inject({
  //     method: 'PUT',
  //     url: `/environment/${environment1.id}`,
  //     payload: {
  //       name: 'Environment 1 Updated',
  //       description: 'Environment 1 description updated'
  //     },
  //     headers: {
  //       'x-e2e-user-email': user1.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json()).toEqual({
  //     id: environment1.id,
  //     name: 'Environment 1 Updated',
  //     description: 'Environment 1 description updated',
  //     isDefault: true,
  //     projectId: project1.id,
  //     lastUpdatedById: user1.id,
  //     lastUpdatedBy: expect.any(Object),
  //     secrets: [],
  //     createdAt: expect.any(String),
  //     updatedAt: expect.any(String)
  //   })

  //   environment1 = response.json()
  // })

  // it('should not be able to update an environment that does not exist', async () => {
  //   const response = await app.inject({
  //     method: 'PUT',
  //     url: `/environment/123`,
  //     payload: {
  //       name: 'Environment 1 Updated',
  //       description: 'Environment 1 description updated'
  //     },
  //     headers: {
  //       'x-e2e-user-email': user1.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(404)
  //   expect(response.json().message).toBe('Environment with id 123 not found')
  // })

  // it('should not be able to update an environment that the user does not have access to', async () => {
  //   const response = await app.inject({
  //     method: 'PUT',
  //     url: `/environment/${environment1.id}`,
  //     payload: {
  //       name: 'Environment 1 Updated',
  //       description: 'Environment 1 description updated'
  //     },
  //     headers: {
  //       'x-e2e-user-email': user2.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(401)
  //   expect(response.json().message).toBe(
  //     `User ${user2.id} does not have the required authorities`
  //   )
  // })

  // it('should not be able to update an environment to a duplicate name', async () => {
  //   const response = await app.inject({
  //     method: 'PUT',
  //     url: `/environment/${environment1.id}`,
  //     payload: {
  //       name: 'Environment 2',
  //       description: 'Environment 1 description updated'
  //     },
  //     headers: {
  //       'x-e2e-user-email': user1.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(409)
  //   expect(response.json().message).toBe(
  //     `Environment with name Environment 2 already exists in project ${project1.id}`
  //   )
  // })

  // it('should create a ENVIRONMENT_UPDATED event', async () => {
  //   const response = await fetchEvents(
  //     app,
  //     user1,
  //     'environmentId=' + environment1.id
  //   )

  //   const event = {
  //     id: expect.any(String),
  //     title: expect.any(String),
  //     description: expect.any(String),
  //     source: EventSource.ENVIRONMENT,
  //     triggerer: EventTriggerer.USER,
  //     severity: EventSeverity.INFO,
  //     type: EventType.ENVIRONMENT_UPDATED,
  //     timestamp: expect.any(String),
  //     metadata: expect.any(Object)
  //   }

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json()).toEqual(expect.arrayContaining([event]))
  // })

  // it('should make other environments non-default if the current environment is the default one', async () => {
  //   const response = await app.inject({
  //     method: 'PUT',
  //     url: `/environment/${environment2.id}`,
  //     payload: {
  //       name: 'Environment 2 Updated',
  //       description: 'Environment 2 description updated',
  //       isDefault: true
  //     },
  //     headers: {
  //       'x-e2e-user-email': user1.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().name).toBe('Environment 2 Updated')
  //   expect(response.json().description).toBe(
  //     'Environment 2 description updated'
  //   )
  //   expect(response.json().isDefault).toBe(true)

  //   const environments = await prisma.environment.findMany({
  //     where: {
  //       projectId: project1.id
  //     }
  //   })

  //   expect(environments.length).toBe(3)
  //   expect(environments.filter((e) => e.isDefault).length).toBe(1)

  //   environment2 = response.json()
  //   environment1.isDefault = false
  // })

  // it('should be able to fetch an environment', async () => {
  //   const response = await app.inject({
  //     method: 'GET',
  //     url: `/environment/${environment1.id}`,
  //     headers: {
  //       'x-e2e-user-email': user1.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().name).toBe('Environment 1 Updated')
  //   expect(response.json().description).toBe(
  //     'Environment 1 description updated'
  //   )
  //   expect(response.json().isDefault).toBe(false)
  // })

  // it('should not be able to fetch an environment that does not exist', async () => {
  //   const response = await app.inject({
  //     method: 'GET',
  //     url: `/environment/123`,
  //     headers: {
  //       'x-e2e-user-email': user1.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(404)
  //   expect(response.json().message).toBe('Environment with id 123 not found')
  // })

  // it('should not be able to fetch an environment that the user does not have access to', async () => {
  //   const response = await app.inject({
  //     method: 'GET',
  //     url: `/environment/${environment1.id}`,
  //     headers: {
  //       'x-e2e-user-email': user2.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(401)
  //   expect(response.json().message).toBe(
  //     `User ${user2.id} does not have the required authorities`
  //   )
  // })

  // it('should be able to fetch all environments of a project', async () => {
  //   const response = await app.inject({
  //     method: 'GET',
  //     url: `/environment/all/${project1.id}`,
  //     headers: {
  //       'x-e2e-user-email': user1.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(200)
  // })

  // it('should not be able to fetch all environments of a project that does not exist', async () => {
  //   const response = await app.inject({
  //     method: 'GET',
  //     url: `/environment/all/123`,
  //     headers: {
  //       'x-e2e-user-email': user1.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(404)
  //   expect(response.json().message).toBe('Project with id 123 not found')
  // })

  // it('should not be able to fetch all environments of a project that the user does not have access to', async () => {
  //   const response = await app.inject({
  //     method: 'GET',
  //     url: `/environment/all/${project1.id}`,
  //     headers: {
  //       'x-e2e-user-email': user2.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(401)
  //   expect(response.json().message).toBe(
  //     `User with id ${user2.id} does not have the authority in the project with id ${project1.id}`
  //   )
  // })

  // it('should be able to delete an environment', async () => {
  //   const response = await app.inject({
  //     method: 'DELETE',
  //     url: `/environment/${environment1.id}`,
  //     headers: {
  //       'x-e2e-user-email': user1.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(200)
  // })

  // it('should not be able to delete an environment that does not exist', async () => {
  //   const response = await app.inject({
  //     method: 'DELETE',
  //     url: `/environment/123`,
  //     headers: {
  //       'x-e2e-user-email': user1.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(404)
  //   expect(response.json().message).toBe('Environment with id 123 not found')
  // })

  // it('should not be able to delete an environment that the user does not have access to', async () => {
  //   const response = await app.inject({
  //     method: 'DELETE',
  //     url: `/environment/${environment2.id}`,
  //     headers: {
  //       'x-e2e-user-email': user2.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(401)
  //   expect(response.json().message).toBe(
  //     `User ${user2.id} does not have the required authorities`
  //   )
  // })

  // it('should not be able to delete the default environment of a project', async () => {
  //   const response = await app.inject({
  //     method: 'DELETE',
  //     url: `/environment/${environment2.id}`,
  //     headers: {
  //       'x-e2e-user-email': user1.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(400)
  //   expect(response.json().message).toBe(
  //     'Cannot delete the default environment'
  //   )
  // })

  // it('should not be able to make the only environment non-default', async () => {
  //   await prisma.environment.delete({
  //     where: {
  //       projectId_name: {
  //         projectId: project1.id,
  //         name: 'Default'
  //       }
  //     }
  //   })

  //   const response = await app.inject({
  //     method: 'PUT',
  //     url: `/environment/${environment2.id}`,
  //     payload: {
  //       isDefault: false
  //     },
  //     headers: {
  //       'x-e2e-user-email': user1.email
  //     }
  //   })

  //   expect(response.statusCode).toBe(400)
  //   expect(response.json().message).toBe(
  //     'Cannot make the last environment non-default'
  //   )
  // })

  afterAll(async () => {
    await cleanUp(prisma)
  })
})
