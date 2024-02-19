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
  Authority,
  EventSeverity,
  EventSource,
  EventTriggerer,
  EventType,
  Project,
  User,
  Workspace,
  WorkspaceRole
} from '@prisma/client'
import { v4 } from 'uuid'
import fetchEvents from '../common/fetch-events'

describe('Project Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService

  let user1: User, user2: User
  let workspace1: Workspace
  let project1: Project, project2: Project, otherProject: Project
  let adminRole1: WorkspaceRole

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, ProjectModule]
    })
      .overrideProvider(MAIL_SERVICE)
      .useClass(MockMailService)
      .compile()

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    )
    prisma = moduleRef.get(PrismaService)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()

    const workspace1Id = v4()
    const workspace2Id = v4()
    const workspace1AdminRoleId = v4()
    const user1Id = v4(),
      user2Id = v4()

    const createUser1 = prisma.user.create({
      data: {
        id: user1Id,
        email: 'johndoe@keyshade.xyz',
        name: 'John Doe',
        isOnboardingFinished: true
      }
    })

    const createUser2 = prisma.user.create({
      data: {
        id: user2Id,
        email: 'janedoe@keyshade.xyz',
        name: 'Jane Doe',
        isOnboardingFinished: true
      }
    })

    const createWorkspace1 = prisma.workspace.create({
      data: {
        id: workspace1Id,
        name: 'Workspace 1',
        ownerId: user1Id
      }
    })

    const createWorkspace1AdminRole = prisma.workspaceRole.create({
      data: {
        id: workspace1AdminRoleId,
        name: 'Admin',
        hasAdminAuthority: true,
        authorities: [Authority.WORKSPACE_ADMIN],
        workspaceId: workspace1Id
      }
    })

    const createWorkspace1Membership1 = prisma.workspaceMember.create({
      data: {
        userId: user1Id,
        workspaceId: workspace1Id,
        invitationAccepted: true,
        roles: {
          create: {
            roleId: workspace1AdminRoleId
          }
        }
      }
    })

    const createWorkspace2 = prisma.workspace.create({
      data: {
        id: workspace2Id,
        name: 'Workspace 2',
        ownerId: user2Id
      }
    })

    const createOtherProject = prisma.project.create({
      data: {
        name: 'Other Project',
        description: 'Other Project description',
        publicKey: '',
        privateKey: '',
        isPublic: false,
        workspace: {
          connect: {
            id: workspace2Id
          }
        }
      }
    })

    const result = await prisma.$transaction([
      createUser1,
      createUser2,
      createWorkspace1,
      createWorkspace1AdminRole,
      createWorkspace1Membership1,
      createWorkspace2,
      createOtherProject
    ])

    user1 = result[0]
    user2 = result[1]

    workspace1 = result[2]

    otherProject = result[6]

    adminRole1 = result[3]
  })

  it('should be defined', async () => {
    expect(app).toBeDefined()
    expect(prisma).toBeDefined()
  })

  it('should allow workspace member to create a project', async () => {
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

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      id: expect.any(String),
      name: 'Project 1',
      description: 'Project 1 description',
      storePrivateKey: true,
      workspaceId: workspace1.id,
      lastUpdatedById: user1.id,
      isDisabled: false,
      isPublic: false,
      publicKey: expect.any(String),
      privateKey: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      workspaceRoleId: null
    })

    project1 = response.json()
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
    const response = await fetchEvents(app, user1, 'projectId=' + project1.id)

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

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.arrayContaining([event]))
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
        projects: true
      }
    })

    expect(adminRole).toBeDefined()
    expect(adminRole.projects).toHaveLength(1)
    expect(adminRole.projects[0].id).toBe(project1.id)
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
      isPublic: false,
      publicKey: project1.publicKey,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      workspaceRoleId: adminRole1.id
    })

    project1 = response.json()
  })

  it('should not be able to update the name of a project to an existing name', async () => {
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

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({
      statusCode: 409,
      error: 'Conflict',
      message: `Project with this name **Project 1 Updated** already exists`
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
    const response = await fetchEvents(app, user1, 'projectId=' + project1.id)

    const event = {
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      source: EventSource.PROJECT,
      triggerer: EventTriggerer.USER,
      severity: EventSeverity.INFO,
      type: EventType.PROJECT_UPDATED,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.arrayContaining([event]))
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
      privateKey: null,
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
        publicKey: undefined,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
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
        'x-e2e-user-email': user1.email
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

  it('should have removed all environments of the project', async () => {
    const environments = await prisma.environment.findMany({
      where: {
        projectId: project1.id
      }
    })

    expect(environments).toHaveLength(0)
  })

  it('should have removed the project from the admin role of the workspace', async () => {
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
    expect(adminRole.projects).toHaveLength(2)
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
      url: `/project/${otherProject.id}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: `User with id ${user1.id} does not have the authority in the project with id ${otherProject.id}`
    })
  })

  it('should have created a PROJECT_DELETED event', async () => {
    const response = await fetchEvents(
      app,
      user1,
      'workspaceId=' + workspace1.id
    )

    const event = {
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      source: EventSource.WORKSPACE,
      triggerer: EventTriggerer.USER,
      severity: EventSeverity.INFO,
      type: EventType.PROJECT_DELETED,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.arrayContaining([event]))
  })

  afterAll(async () => {
    await cleanUp(prisma)
  })
})
