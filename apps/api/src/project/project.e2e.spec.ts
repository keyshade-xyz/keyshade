import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { PrismaService } from '../prisma/prisma.service'
import { Test } from '@nestjs/testing'
import { AppModule } from '../app/app.module'
import { ProjectModule } from './project.module'
import { MAIL_SERVICE } from '../mail/services/interface.service'
import { MockMailService } from '../mail/services/mock.service'
import cleanUp from '../common/cleanup'
import {
  EventSeverity,
  EventSource,
  EventTriggerer,
  EventType,
  Project,
  User,
  Workspace
} from '@prisma/client'
import fetchEvents from '../common/fetch-events'
import { EventService } from '../event/service/event.service'
import { EventModule } from '../event/event.module'
import { ProjectService } from './service/project.service'
import { WorkspaceService } from '../workspace/service/workspace.service'
import { UserService } from '../user/service/user.service'
import { WorkspaceModule } from '../workspace/workspace.module'
import { UserModule } from '../user/user.module'

describe('Project Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let eventService: EventService
  let projectService: ProjectService
  let workspaceService: WorkspaceService
  let userService: UserService

  let user1: User, user2: User
  let workspace1: Workspace, workspace2: Workspace
  let project1: Project, project2: Project
  let globalProject: Project, internalProject: Project, privateProject: Project

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        ProjectModule,
        EventModule,
        WorkspaceModule,
        UserModule
      ]
    })
      .overrideProvider(MAIL_SERVICE)
      .useClass(MockMailService)
      .compile()

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    )
    prisma = moduleRef.get(PrismaService)
    eventService = moduleRef.get(EventService)
    projectService = moduleRef.get(ProjectService)
    workspaceService = moduleRef.get(WorkspaceService)
    userService = moduleRef.get(UserService)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()

    await cleanUp(prisma)
  })

  beforeEach(async () => {
    const createUser1 = await userService.createUser({
      name: 'John Doe',
      email: 'johndoe@keyshade.xyz',
      isOnboardingFinished: true,
      isActive: true,
      isAdmin: false
    })

    const createUser2 = await userService.createUser({
      name: 'Jane Doe',
      email: 'janedoe@keyshade.xyz',
      isOnboardingFinished: true,
      isActive: true,
      isAdmin: false
    })

    workspace1 = createUser1.defaultWorkspace as Workspace
    workspace2 = createUser2.defaultWorkspace as Workspace

    delete createUser1.defaultWorkspace
    delete createUser2.defaultWorkspace

    user1 = createUser1
    user2 = createUser2

    project1 = (await projectService.createProject(user1, workspace1.id, {
      name: 'Project 1',
      description: 'Project 1 description',
      storePrivateKey: true
    })) as Project

    project2 = (await projectService.createProject(user2, workspace2.id, {
      name: 'Project 2',
      description: 'Project 2 description',
      storePrivateKey: false
    })) as Project
  })

  afterEach(async () => {
    await prisma.user.deleteMany()
    await prisma.workspace.deleteMany()
  })

  it('should be defined', async () => {
    expect(app).toBeDefined()
    expect(prisma).toBeDefined()
    expect(eventService).toBeDefined()
    expect(projectService).toBeDefined()
    expect(workspaceService).toBeDefined()
    expect(userService).toBeDefined()
  })

  it('should allow workspace member to create a project', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/project/${workspace1.id}`,
      payload: {
        name: 'Project 3',
        description: 'Project 3 description',
        storePrivateKey: true
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      id: expect.any(String),
      name: 'Project 3',
      description: 'Project 3 description',
      storePrivateKey: true,
      workspaceId: workspace1.id,
      lastUpdatedById: user1.id,
      isDisabled: false,
      accessLevel: 'PRIVATE',
      publicKey: expect.any(String),
      privateKey: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      pendingCreation: false
    })
  })

  it('should have created a default environment', async () => {
    const environments = await prisma.environment.findMany({
      where: {
        projectId: project1.id
      }
    })

    expect(environments).toHaveLength(1)
  })

  it('should not allow workspace member to create a project with the same name', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/project/${workspace1.id}`,
      payload: {
        name: 'Project 1',
        description: 'Project 1 description',
        storePrivateKey: true
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({
      statusCode: 409,
      error: 'Conflict',
      message: `Project with this name **Project 1** already exists`
    })
  })

  it('should have created a PROJECT_CREATED event', async () => {
    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.PROJECT
    )

    const event = response[0]

    expect(event.source).toBe(EventSource.PROJECT)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.PROJECT_CREATED)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBeDefined()
  })

  it('should have added the project to the admin role of the workspace', async () => {
    const adminRole = await prisma.workspaceRole.findUnique({
      where: {
        workspaceId_name: {
          workspaceId: workspace1.id,
          name: 'Admin'
        }
      },
      select: {
        projects: {
          select: {
            projectId: true
          }
        }
      }
    })

    expect(adminRole).toBeDefined()
    expect(adminRole.projects).toHaveLength(1)
    expect(adminRole.projects[0].projectId).toBe(project1.id)
  })

  it('should not let non-member create a project', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/project/${workspace1.id}`,
      payload: {
        name: 'Project 2',
        description: 'Project 2 description',
        storePrivateKey: true
      },
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: `User ${user2.id} does not have the required authorities to perform the action`
    })
  })

  it('should not be able to add project to a non existing workspace', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/project/123`,
      payload: {
        name: 'Project 3',
        description: 'Project 3 description',
        storePrivateKey: true
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: `Workspace with id 123 not found`
    })
  })

  it('should be able to update the name and description of a project', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/project/${project1.id}`,
      payload: {
        name: 'Project 1 Updated',
        description: 'Project 1 description updated'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      id: project1.id,
      name: 'Project 1 Updated',
      description: 'Project 1 description updated',
      storePrivateKey: true,
      workspaceId: workspace1.id,
      lastUpdatedById: user1.id,
      isDisabled: false,
      accessLevel: 'PRIVATE',
      publicKey: project1.publicKey,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      pendingCreation: false
    })

    project1 = response.json()
  })

  it('should not be able to update the name of a project to an existing name', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/project/${project1.id}`,
      payload: {
        name: 'Project 1'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({
      statusCode: 409,
      error: 'Conflict',
      message: `Project with this name **Project 1** already exists`
    })
  })

  it('should not be able to update a non existing project', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/project/123`,
      payload: {
        name: 'Project 1 Updated',
        description: 'Project 1 description updated'
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: `Project with id 123 not found`
    })
  })

  it('should not be able to update a project if the user is not a member of the workspace', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/project/${project1.id}`,
      payload: {
        name: 'Project 1 Updated',
        description: 'Project 1 description updated'
      },
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: `User with id ${user2.id} does not have the authority in the project with id ${project1.id}`
    })
  })

  it('should have created a PROJECT_UPDATED event', async () => {
    await projectService.updateProject(user1, project1.id, {
      name: 'Project 1 Updated',
      description: 'Project 1 description'
    })

    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.PROJECT
    )

    const event = response[0]

    expect(event.source).toBe(EventSource.PROJECT)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.PROJECT_UPDATED)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBe(project1.id)
  })

  it('should be able to fetch a project by its id', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/project/${project1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      ...project1,
      lastUpdatedById: user1.id,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      secrets: []
    })
  })

  it('should not be able to fetch a non existing project', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/project/123`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: `Project with id 123 not found`
    })
  })

  it('should not be able to fetch a project if the user is not a member of the workspace', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/project/${project1.id}`,
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: `User with id ${user2.id} does not have the authority in the project with id ${project1.id}`
    })
  })

  it('should be able to fetch all projects of a workspace', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/project/all/${workspace1.id}?page=0`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([
      {
        ...project1,
        lastUpdatedById: user1.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        publicKey: undefined,
        privateKey: undefined
      }
    ])
  })

  it('should not be able to fetch all projects of a non existing workspace', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/project/all/123`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: `Workspace with id 123 not found`
    })
  })

  it('should not be able to fetch all projects of a workspace if the user is not a member of the workspace', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/project/all/${workspace1.id}`,
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: `User ${user2.id} does not have the required authorities to perform the action`
    })
  })

  // ---------------------------------------------------------

  it('should not store the private key if storePrivateKey is false', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/project/${workspace1.id}`,
      payload: {
        name: 'Project 2',
        description: 'Project 2 description',
        storePrivateKey: false
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(201)

    const projectId = response.json().id

    project2 = await prisma.project.findUnique({
      where: {
        id: projectId
      }
    })

    expect(project2).toBeDefined()
    expect(project2.privateKey).toBeNull()
  })

  it('should create environments if provided', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/project/${workspace1.id}`,
      payload: {
        name: 'Project 3',
        description: 'Project 3 description',
        storePrivateKey: false,

        environments: [
          {
            name: 'default env',
            isDefault: true
          },
          {
            name: "shouldn't be default",
            isDefault: true
          },
          {
            name: 'regular'
          }
        ]
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(201)

    const projectId = response.json().id

    const environments = await prisma.environment.findMany({
      where: {
        projectId
      }
    })

    expect(environments).toHaveLength(3)
    expect(environments[0].isDefault).toBe(true)
    expect(environments[1].isDefault).toBe(false)
    expect(environments[2].isDefault).toBe(false)
  })

  it('should generate new key-pair if regenerateKeyPair is true and and the project stores the private key or a private key is specified', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/project/${project1.id}`,
      payload: {
        regenerateKeyPair: true
      },
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().publicKey).not.toBeNull()
    expect(response.json().privateKey).not.toBeNull()

    project1 = response.json()
  })

  it('should not regenerate key-pair if regenerateKeyPair is true and the project does not store the private key and a private key is not specified', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/project/${project2.id}`,
      payload: {
        regenerateKeyPair: true
      },
      headers: {
        'x-e2e-user-email': user2.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().publicKey).toEqual(project2.publicKey)
    expect(response.json().privateKey).toBeUndefined()
  })

  it('should be able to delete a project', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/project/${project1.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
  })

  it('should have created a PROJECT_DELETED event', async () => {
    await projectService.deleteProject(user1, project1.id)

    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.PROJECT
    )

    const event = response[0]

    expect(event.source).toBe(EventSource.PROJECT)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.PROJECT_DELETED)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBe(project1.id)
  })

  it('should have removed all environments of the project', async () => {
    await projectService.deleteProject(user1, project1.id)

    const environments = await prisma.environment.findMany({
      where: {
        projectId: project1.id
      }
    })

    expect(environments).toHaveLength(0)
  })

  it('should have removed the project from the admin role of the workspace', async () => {
    await projectService.deleteProject(user1, project1.id)

    const adminRole = await prisma.workspaceRole.findUnique({
      where: {
        workspaceId_name: {
          workspaceId: workspace1.id,
          name: 'Admin'
        }
      },
      select: {
        projects: true
      }
    })

    expect(adminRole).toBeDefined()
    expect(adminRole.projects).toHaveLength(0)
  })

  it('should not be able to delete a non existing project', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/project/123`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: `Project with id 123 not found`
    })
  })

  it('should not be able to delete a project if the user is not a member of the workspace', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/project/${project2.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: `User with id ${user1.id} does not have the authority in the project with id ${project2.id}`
    })
  })

  describe('Project Controller tests for access levels', () => {
    beforeEach(async () => {
      globalProject = (await projectService.createProject(
        user1,
        workspace1.id,
        {
          name: 'Global Project',
          description: 'Global Project description',
          storePrivateKey: true,
          accessLevel: 'GLOBAL'
        }
      )) as Project

      internalProject = (await projectService.createProject(
        user1,
        workspace1.id,
        {
          name: 'Internal Project',
          description: 'Internal Project description',
          storePrivateKey: true,
          accessLevel: 'INTERNAL'
        }
      )) as Project
    })

    afterEach(async () => {
      await prisma.user.deleteMany()
      await prisma.workspace.deleteMany()
    })

    it('should allow any user to access a global project', async () => {
      privateProject = (await projectService.createProject(
        user1,
        workspace1.id,
        {
          name: 'Private Project',
          description: 'Private Project description',
          storePrivateKey: true,
          accessLevel: 'PRIVATE'
        }
      )) as Project

      const response = await app.inject({
        method: 'GET',
        url: `/project/${globalProject.id}`,
        headers: {
          'x-e2e-user-email': user2.email // user2 is not a member of workspace1
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        ...globalProject,
        lastUpdatedById: user1.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        secrets: []
      })
    })

    it('should allow workspace members with READ_PROJECT to access an internal project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/project/${internalProject.id}`,
        headers: {
          'x-e2e-user-email': user1.email // user1 is a member of workspace1
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        ...internalProject,
        lastUpdatedById: user1.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        secrets: []
      })
    })

    it('should not allow non-members to access an internal project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/project/${internalProject.id}`,
        headers: {
          'x-e2e-user-email': user2.email // user2 is not a member of workspace1
        }
      })

      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: `User with id ${user2.id} does not have the authority in the project with id ${internalProject.id}`
      })
    })
  })

  it('should allow users with sufficient access to access a private project', async () => {
    const privateProject = (await projectService.createProject(
      user1,
      workspace1.id,
      {
        name: 'Private Project',
        description: 'Private Project description',
        storePrivateKey: true,
        accessLevel: 'PRIVATE'
      }
    )) as Project

    const adminRole = await prisma.workspaceRole.findUnique({
      where: {
        workspaceId_name: {
          workspaceId: workspace1.id,
          name: 'Admin'
        }
      }
    })

    const newUser = await prisma.user.create({
      data: {
        email: 'newuser@example.com',
        name: 'New User',
        isActive: true,
        isAdmin: true,
        isOnboardingFinished: true
      }
    })

    await prisma.workspaceMember.create({
      data: {
        userId: newUser.id,
        workspaceId: workspace1.id,
        invitationAccepted: true,
        roles: {
          create: {
            roleId: adminRole.id
          }
        }
      }
    })

    const response = await app.inject({
      method: 'GET',
      url: `/project/${privateProject.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      ...privateProject,
      lastUpdatedById: user1.id,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      secrets: []
    })
  })

  it('should not allow users without sufficient access to access a private project', async () => {
    const privateProject = (await projectService.createProject(
      user1,
      workspace1.id,
      {
        name: 'Private Project',
        description: 'Private Project description',
        storePrivateKey: true,
        accessLevel: 'PRIVATE'
      }
    )) as Project

    const response = await app.inject({
      method: 'GET',
      url: `/project/${privateProject.id}`,
      headers: {
        'x-e2e-user-email': user2.email // user2 is not a member of workspace1
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: `User with id ${user2.id} does not have the authority in the project with id ${privateProject.id}`
    })
  })

  afterAll(async () => {
    await cleanUp(prisma)
  })
})
