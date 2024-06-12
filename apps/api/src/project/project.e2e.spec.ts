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
import {
  Authority,
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
import fetchEvents from '../common/fetch-events'
import { EventService } from '../event/service/event.service'
import { EventModule } from '../event/event.module'
import { ProjectService } from './service/project.service'
import { WorkspaceService } from '../workspace/service/workspace.service'
import { UserService } from '../user/service/user.service'
import { WorkspaceModule } from '../workspace/workspace.module'
import { UserModule } from '../user/user.module'
import { WorkspaceRoleModule } from '../workspace-role/workspace-role.module'
import { WorkspaceRoleService } from '../workspace-role/service/workspace-role.service'
import { EnvironmentService } from '../environment/service/environment.service'
import { SecretService } from '../secret/service/secret.service'
import { VariableService } from '../variable/service/variable.service'
import { VariableModule } from '../variable/variable.module'
import { SecretModule } from '../secret/secret.module'
import { EnvironmentModule } from '../environment/environment.module'

describe('Project Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let eventService: EventService
  let projectService: ProjectService
  let workspaceService: WorkspaceService
  let userService: UserService
  let workspaceRoleService: WorkspaceRoleService
  let environmentService: EnvironmentService
  let secretService: SecretService
  let variableService: VariableService

  let user1: User, user2: User
  let workspace1: Workspace, workspace2: Workspace
  let project1: Project, project2: Project, project3: Project

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        ProjectModule,
        EventModule,
        WorkspaceModule,
        UserModule,
        WorkspaceRoleModule,
        EnvironmentModule,
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
    eventService = moduleRef.get(EventService)
    projectService = moduleRef.get(ProjectService)
    workspaceService = moduleRef.get(WorkspaceService)
    userService = moduleRef.get(UserService)
    workspaceRoleService = moduleRef.get(WorkspaceRoleService)
    environmentService = moduleRef.get(EnvironmentService)
    secretService = moduleRef.get(SecretService)
    variableService = moduleRef.get(VariableService)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
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

    project3 = (await projectService.createProject(user1, workspace1.id, {
      name: 'Project for fork',
      description: 'Project for fork',
      storePrivateKey: true,
      accessLevel: ProjectAccessLevel.GLOBAL
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
    expect(workspaceRoleService).toBeDefined()
    expect(environmentService).toBeDefined()
    expect(secretService).toBeDefined()
    expect(variableService).toBeDefined()
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
    expect(response.json().id).toBeDefined()
    expect(response.json().name).toBe('Project 3')
    expect(response.json().description).toBe('Project 3 description')
    expect(response.json().storePrivateKey).toBe(true)
    expect(response.json().workspaceId).toBe(workspace1.id)
    expect(response.json().lastUpdatedById).toBe(user1.id)
    expect(response.json().accessLevel).toBe(ProjectAccessLevel.PRIVATE)
    expect(response.json().publicKey).toBeDefined()
    expect(response.json().privateKey).toBeDefined()
    expect(response.json().createdAt).toBeDefined()
    expect(response.json().updatedAt).toBeDefined()
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
    expect(adminRole.projects).toHaveLength(2)
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
    expect(response.json().id).toBe(project1.id)
    expect(response.json().name).toBe('Project 1 Updated')
    expect(response.json().description).toBe('Project 1 description updated')
    expect(response.json().storePrivateKey).toBe(true)
    expect(response.json().workspaceId).toBe(workspace1.id)
    expect(response.json().lastUpdatedById).toBe(user1.id)
    expect(response.json().isDisabled).toBe(false)
    expect(response.json().accessLevel).toBe(ProjectAccessLevel.PRIVATE)
    expect(response.json().publicKey).toBe(project1.publicKey)
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
      updatedAt: expect.any(String)
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
    expect(response.json().length).toEqual(2)
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

    expect(response.statusCode).toBe(400)
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
    expect(adminRole.projects).toHaveLength(1)
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
    let globalProject: Project, internalProject: Project

    beforeEach(async () => {
      globalProject = (await projectService.createProject(
        user1,
        workspace1.id,
        {
          name: 'Global Project',
          description: 'Global Project description',
          storePrivateKey: true,
          accessLevel: ProjectAccessLevel.GLOBAL
        }
      )) as Project

      internalProject = (await projectService.createProject(
        user1,
        workspace1.id,
        {
          name: 'Internal Project',
          description: 'Internal Project description',
          storePrivateKey: true,
          accessLevel: ProjectAccessLevel.INTERNAL
        }
      )) as Project
    })

    afterEach(async () => {
      await prisma.user.deleteMany()
      await prisma.workspace.deleteMany()
    })

    it('should allow any user to access a global project', async () => {
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
        updatedAt: expect.any(String)
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
        updatedAt: expect.any(String)
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

    it('should not allow outsiders to update a GLOBAL project', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/project/${globalProject.id}`,
        payload: {
          name: 'Global Project Updated'
        },
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: `User with id ${user2.id} does not have the authority in the project with id ${globalProject.id}`
      })
    })

    it('should store private key even if specified not to in a global project', async () => {
      const project = (await projectService.createProject(
        user1,
        workspace1.id,
        {
          name: 'Global Project 2',
          description: 'Global Project description',
          storePrivateKey: false,
          accessLevel: ProjectAccessLevel.GLOBAL
        }
      )) as Project

      expect(project).toBeDefined()
      expect(project.privateKey).not.toBeNull()
      expect(project.publicKey).not.toBeNull()
      expect(project.storePrivateKey).toBe(true)
    })

    it('should require WORKSPACE_ADMIN authority to alter the access level', async () => {
      // Create a user
      const johnny = await userService.createUser({
        name: 'Johnny Doe',
        email: 'johhny@keyshade.xyz',
        isOnboardingFinished: true,
        isActive: true,
        isAdmin: false
      })

      // Create a member role for the workspace
      const role = await workspaceRoleService.createWorkspaceRole(
        user1,
        workspace1.id,
        {
          name: 'Member',
          authorities: [Authority.READ_PROJECT]
        }
      )

      // Add user to workspace as a member
      await workspaceService.inviteUsersToWorkspace(user1, workspace1.id, [
        {
          email: johnny.email,
          roleIds: [role.id]
        }
      ])

      // Accept the invitation on behalf of the user
      await workspaceService.acceptInvitation(johnny, workspace1.id)

      // Update the access level of the project
      const response = await app.inject({
        method: 'PUT',
        url: `/project/${internalProject.id}`,
        payload: {
          accessLevel: ProjectAccessLevel.INTERNAL
        },
        headers: {
          'x-e2e-user-email': johnny.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should store the private key if access level of INTERNAL/PRIVATE project is updated to GLOBAL', async () => {
      // Create a project with access level INTERNAL
      const project = (await projectService.createProject(
        user1,
        workspace1.id,
        {
          name: 'Internal Project 2',
          description: 'Internal Project description',
          storePrivateKey: true,
          accessLevel: ProjectAccessLevel.INTERNAL
        }
      )) as Project

      // Update the access level of the project to GLOBAL
      const updatedProject = (await projectService.updateProject(
        user1,
        project.id,
        {
          accessLevel: ProjectAccessLevel.GLOBAL
        }
      )) as Project

      expect(updatedProject).toBeDefined()
      expect(updatedProject.privateKey).toBe(project.privateKey)
      expect(updatedProject.publicKey).toBe(project.publicKey)
      expect(updatedProject.storePrivateKey).toBe(true)
    })

    it('should throw an error while setting access level to GLOBAL if private key is not specified and project does not store private key', async () => {
      const project = (await projectService.createProject(
        user1,
        workspace1.id,
        {
          name: 'Internal Project 2',
          description: 'Internal Project description',
          storePrivateKey: false,
          accessLevel: ProjectAccessLevel.INTERNAL
        }
      )) as Project

      const response = await app.inject({
        method: 'PUT',
        url: `/project/${project.id}`,
        payload: {
          accessLevel: ProjectAccessLevel.GLOBAL
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Private key is required to make the project GLOBAL'
      })
    })

    it('should regenerate key-pair if access level of GLOBAL project is updated to INTERNAL or PRIVATE', async () => {
      const project = (await projectService.createProject(
        user1,
        workspace1.id,
        {
          name: 'Global Project 2',
          description: 'Global Project description',
          storePrivateKey: true,
          accessLevel: ProjectAccessLevel.GLOBAL
        }
      )) as Project

      const response = await app.inject({
        method: 'PUT',
        url: `/project/${project.id}`,
        payload: {
          accessLevel: ProjectAccessLevel.INTERNAL
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().publicKey).not.toBe(project.publicKey)
      expect(response.json().privateKey).not.toBe(project.privateKey)
      expect(response.json().storePrivateKey).toBe(false)
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
        accessLevel: ProjectAccessLevel.PRIVATE
      }
    )) as Project

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
      updatedAt: expect.any(String)
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
        accessLevel: ProjectAccessLevel.PRIVATE
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

  describe('Project Controller tests for forking', () => {
    it('should be able to fork a project', async () => {
      const forkedProject = (await projectService.forkProject(
        user2,
        project3.id,
        {
          name: 'Forked Project'
        }
      )) as Project

      expect(forkedProject).toBeDefined()
      expect(forkedProject.name).toBe('Forked Project')
      expect(forkedProject.publicKey).toBeDefined()
      expect(forkedProject.privateKey).toBeDefined()
      expect(forkedProject.publicKey).not.toBe(project3.publicKey)
      expect(forkedProject.privateKey).not.toBe(project3.privateKey)
      expect(forkedProject.storePrivateKey).toBe(true)
      expect(forkedProject.isForked).toBe(true)
      expect(forkedProject.forkedFromId).toBe(project3.id)

      const forkedProjectFromDB = await prisma.project.findUnique({
        where: {
          id: forkedProject.id
        }
      })

      expect(forkedProjectFromDB).toBeDefined()
      expect(forkedProjectFromDB.name).toBe('Forked Project')
      expect(forkedProjectFromDB.publicKey).toBeDefined()
      expect(forkedProjectFromDB.privateKey).toBeDefined()
      expect(forkedProjectFromDB.publicKey).not.toBe(project3.publicKey)
      expect(forkedProjectFromDB.privateKey).not.toBe(project3.privateKey)
      expect(forkedProjectFromDB.storePrivateKey).toBe(true)
      expect(forkedProjectFromDB.isForked).toBe(true)
      expect(forkedProjectFromDB.forkedFromId).toBe(project3.id)
    })

    it('should not be able to fork a project that does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/project/123/fork`,
        payload: {
          name: 'Forked Project'
        },
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(404)
      expect(response.json()).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: `Project with id 123 not found`
      })
    })

    it('should not be able to fork a project that is not GLOBAL', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/project/${project2.id}/fork`,
        payload: {
          name: 'Forked Project'
        },
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

    it('should fork the project in the default workspace if workspace id is not specified', async () => {
      const forkedProject = (await projectService.forkProject(
        user2,
        project3.id,
        {
          name: 'Forked Project'
        }
      )) as Project

      expect(forkedProject.workspaceId).toBe(workspace2.id)
    })

    it('should fork the project in the specific workspace if the ID is provided in the payload', async () => {
      const newWorkspace = (await workspaceService.createWorkspace(user2, {
        name: 'New Workspace'
      })) as Workspace

      const forkedProject = (await projectService.forkProject(
        user2,
        project3.id,
        {
          name: 'Forked Project',
          workspaceId: newWorkspace.id
        }
      )) as Project

      expect(forkedProject.workspaceId).toBe(newWorkspace.id)
    })

    it('should not be able to create a fork with the same name in a workspace', async () => {
      await projectService.createProject(user2, workspace2.id, {
        name: 'Forked Project',
        description: 'Forked Project description',
        storePrivateKey: true,
        accessLevel: ProjectAccessLevel.GLOBAL
      })

      const response = await app.inject({
        method: 'POST',
        url: `/project/${project3.id}/fork`,
        payload: {
          name: 'Forked Project'
        },
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(409)
      expect(response.json()).toEqual({
        statusCode: 409,
        error: 'Conflict',
        message: `Project with this name **Forked Project** already exists in the selected workspace`
      })
    })

    it('should copy over all environments, secrets and variables into the forked project', async () => {
      // Add an environment to the project
      const environment = (await environmentService.createEnvironment(
        user1,
        {
          name: 'Dev'
        },
        project3.id
      )) as Environment

      // Add two secrets
      const secret1 = (await secretService.createSecret(
        user1,
        {
          name: 'API_KEY',
          entries: [
            {
              value: 'some_key',
              environmentId: environment.id
            }
          ]
        },
        project3.id
      )) as Secret

      const secret2 = (await secretService.createSecret(
        user1,
        {
          name: 'DB_PASSWORD',
          entries: [
            {
              value: 'password',
              environmentId: environment.id
            }
          ]
        },
        project3.id
      )) as Secret

      // Add two variables
      const variable1 = (await variableService.createVariable(
        user1,
        {
          name: 'PORT',
          entries: [
            {
              value: '8080',
              environmentId: environment.id
            }
          ]
        },
        project3.id
      )) as Variable

      const variable2 = (await variableService.createVariable(
        user1,
        {
          name: 'EXPIRY',
          entries: [
            {
              value: '3600',
              environmentId: environment.id
            }
          ]
        },
        project3.id
      )) as Variable

      // Try forking the project
      const forkedProject = await projectService.forkProject(
        user2,
        project3.id,
        {
          name: 'Forked Project'
        }
      )

      // Fetch the environments of the forked project
      // (there will be 2 because a default environment is always created)
      const forkedEnvironments = await prisma.environment.findMany({
        where: {
          projectId: forkedProject.id
        }
      })

      // Fetch the secrets of the forked project
      const forkedSecrets = await prisma.secret.findMany({
        where: {
          projectId: forkedProject.id
        }
      })

      // Fetch the variables of the forked project
      const forkedVariables = await prisma.variable.findMany({
        where: {
          projectId: forkedProject.id
        }
      })

      expect(forkedEnvironments).toHaveLength(2)
      expect(forkedSecrets).toHaveLength(2)
      expect(forkedVariables).toHaveLength(2)

      const [defaultEnvironment, devEnvironment] = forkedEnvironments
      const [secretInDefaultEnvironment, secretInDevEnvironment] = forkedSecrets
      const [variableInDefaultEnvironment, variableInDevEnvironment] =
        forkedVariables

      expect(secretInDefaultEnvironment).toBeDefined()
      expect(secretInDefaultEnvironment.name).toBe(secret1.name)

      expect(secretInDevEnvironment).toBeDefined()
      expect(secretInDevEnvironment.name).toBe(secret2.name)

      expect(variableInDefaultEnvironment).toBeDefined()
      expect(variableInDefaultEnvironment.name).toBe(variable1.name)

      expect(variableInDevEnvironment).toBeDefined()
      expect(variableInDevEnvironment.name).toBe(variable2.name)

      expect(devEnvironment).toBeDefined()
      expect(devEnvironment.name).toBe(environment.name)

      expect(defaultEnvironment).toBeDefined()
      expect(defaultEnvironment.name).toBe('Default')
    })

    it('should only copy new environments, secrets and variables if sync is not hard', async () => {
      // Add an environment to the project
      const environment = (await environmentService.createEnvironment(
        user1,
        {
          name: 'Dev'
        },
        project3.id
      )) as Environment

      // Add two secrets
      await secretService.createSecret(
        user1,
        {
          name: 'API_KEY',
          entries: [
            {
              value: 'some_key',
              environmentId: environment.id
            }
          ]
        },
        project3.id
      )

      await secretService.createSecret(
        user1,
        {
          name: 'DB_PASSWORD',
          entries: [
            {
              value: 'password',
              environmentId: environment.id
            }
          ]
        },
        project3.id
      )

      // Add two variables
      await variableService.createVariable(
        user1,
        {
          name: 'PORT',
          entries: [
            {
              value: '8080',
              environmentId: environment.id
            }
          ]
        },
        project3.id
      )

      await variableService.createVariable(
        user1,
        {
          name: 'EXPIRY',
          entries: [
            {
              value: '3600',
              environmentId: environment.id
            }
          ]
        },
        project3.id
      )

      // Try forking the project
      const forkedProject = await projectService.forkProject(
        user2,
        project3.id,
        {
          name: 'Forked Project'
        }
      )

      // Add a new environment to the original project
      const newEnvironmentOriginal =
        (await environmentService.createEnvironment(
          user1,
          {
            name: 'Prod'
          },
          project3.id
        )) as Environment

      // Add a new secret to the original project
      await secretService.createSecret(
        user1,
        {
          name: 'NEW_SECRET',
          entries: [
            {
              value: 'new_secret',
              environmentId: newEnvironmentOriginal.id
            }
          ]
        },
        project3.id
      )

      // Add a new variable to the original project
      await variableService.createVariable(
        user1,
        {
          name: 'NEW_VARIABLE',
          entries: [
            {
              value: 'new_variable',
              environmentId: newEnvironmentOriginal.id
            }
          ]
        },
        project3.id
      )

      // Add a new environment to the forked project
      const newEnvironmentForked = (await environmentService.createEnvironment(
        user2,
        {
          name: 'Stage'
        },
        forkedProject.id
      )) as Environment

      // Add a new secret to the forked project
      await secretService.createSecret(
        user2,
        {
          name: 'NEW_SECRET_2',
          entries: [
            {
              value: 'new_secret',
              environmentId: newEnvironmentForked.id
            }
          ]
        },
        forkedProject.id
      )

      // Add a new variable to the forked project
      await variableService.createVariable(
        user2,
        {
          name: 'NEW_VARIABLE_2',
          entries: [
            {
              value: 'new_variable',
              environmentId: newEnvironmentForked.id
            }
          ]
        },
        forkedProject.id
      )

      // Sync the fork
      await app.inject({
        method: 'PUT',
        url: `/project/${forkedProject.id}/sync-fork`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      // Fetch the environments of the forked project
      const forkedEnvironments = await prisma.environment.findMany({
        where: {
          projectId: forkedProject.id
        }
      })

      // Fetch the secrets of the forked project
      const forkedSecrets = await prisma.secret.findMany({
        where: {
          projectId: forkedProject.id
        }
      })

      // Fetch the variables of the forked project
      const forkedVariables = await prisma.variable.findMany({
        where: {
          projectId: forkedProject.id
        }
      })

      expect(forkedEnvironments).toHaveLength(4)
      expect(forkedSecrets).toHaveLength(4)
      expect(forkedVariables).toHaveLength(4)
    })

    it('should only replace environments, secrets and variables if sync is hard', async () => {
      const environment = (await environmentService.createEnvironment(
        user1,
        {
          name: 'Dev'
        },
        project3.id
      )) as Environment

      // Add two secrets
      await secretService.createSecret(
        user1,
        {
          name: 'API_KEY',
          entries: [
            {
              value: 'some_key',
              environmentId: environment.id
            }
          ]
        },
        project3.id
      )

      await secretService.createSecret(
        user1,
        {
          name: 'DB_PASSWORD',
          entries: [
            {
              value: 'password',
              environmentId: environment.id
            }
          ]
        },
        project3.id
      )

      // Add two variables
      await variableService.createVariable(
        user1,
        {
          name: 'PORT',
          entries: [
            {
              value: '8080',
              environmentId: environment.id
            }
          ]
        },
        project3.id
      )

      await variableService.createVariable(
        user1,
        {
          name: 'EXPIRY',
          entries: [
            {
              value: '3600',
              environmentId: environment.id
            }
          ]
        },
        project3.id
      )

      // Try forking the project
      const forkedProject = await projectService.forkProject(
        user2,
        project3.id,
        {
          name: 'Forked Project'
        }
      )

      // Add a new environment to the original project
      const newEnvironmentOriginal =
        (await environmentService.createEnvironment(
          user1,
          {
            name: 'Prod'
          },
          project3.id
        )) as Environment

      // Add a new secret to the original project
      await secretService.createSecret(
        user1,
        {
          name: 'NEW_SECRET',
          entries: [
            {
              value: 'new_secret',
              environmentId: newEnvironmentOriginal.id
            }
          ]
        },
        project3.id
      )

      // Add a new variable to the original project
      await variableService.createVariable(
        user1,
        {
          name: 'NEW_VARIABLE',
          entries: [
            {
              value: 'new_variable',
              environmentId: newEnvironmentOriginal.id
            }
          ]
        },
        project3.id
      )

      // Add a new environment to the forked project
      const newEnvironmentForked = (await environmentService.createEnvironment(
        user2,
        {
          name: 'Prod'
        },
        forkedProject.id
      )) as Environment

      // Add a new secret to the forked project
      await secretService.createSecret(
        user2,
        {
          name: 'NEW_SECRET',
          entries: [
            {
              value: 'new_secret',
              environmentId: newEnvironmentForked.id
            }
          ]
        },
        forkedProject.id
      )

      // Add a new variable to the forked project
      await variableService.createVariable(
        user2,
        {
          name: 'NEW_VARIABLE',
          entries: [
            {
              value: 'new_variable',
              environmentId: newEnvironmentForked.id
            }
          ]
        },
        forkedProject.id
      )

      // Sync the fork
      await app.inject({
        method: 'PUT',
        url: `/project/${forkedProject.id}/sync-fork?hardSync=true`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      // Fetch the environments of the forked project
      const forkedEnvironments = await prisma.environment.findMany({
        where: {
          projectId: forkedProject.id
        }
      })

      // Fetch the secrets of the forked project
      const forkedSecrets = await prisma.secret.findMany({
        where: {
          projectId: forkedProject.id
        }
      })

      // Fetch the variables of the forked project
      const forkedVariables = await prisma.variable.findMany({
        where: {
          projectId: forkedProject.id
        }
      })

      expect(forkedEnvironments).toHaveLength(3)
      expect(forkedSecrets).toHaveLength(3)
      expect(forkedVariables).toHaveLength(3)
    })

    it('should not be able to sync a project that is not forked', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/project/${project3.id}/sync-fork`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: `Project with id ${project3.id} is not a forked project`
      })
    })

    it('should be able to unlink a forked project', async () => {
      const forkedProject = await projectService.forkProject(
        user2,
        project3.id,
        {
          name: 'Forked Project'
        }
      )

      const response = await app.inject({
        method: 'PUT',
        url: `/project/${forkedProject.id}/unlink-fork`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(200)

      const forkedProjectFromDB = await prisma.project.findUnique({
        where: {
          id: forkedProject.id
        }
      })

      expect(forkedProjectFromDB).toBeDefined()
      expect(forkedProjectFromDB.isForked).toBe(false)
      expect(forkedProjectFromDB.forkedFromId).toBeNull()
    })

    it('should be able to fetch all forked projects of a project', async () => {
      await projectService.forkProject(user2, project3.id, {
        name: 'Forked Project'
      })

      const response = await app.inject({
        method: 'GET',
        url: `/project/${project3.id}/forks`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toHaveLength(1)
    })

    it('should not contain a forked project that has access level other than GLOBAL', async () => {
      // Make a hidden fork
      const hiddenProject = await projectService.forkProject(
        user2,
        project3.id,
        {
          name: 'Hidden Forked Project'
        }
      )
      await projectService.updateProject(user2, hiddenProject.id, {
        accessLevel: ProjectAccessLevel.INTERNAL
      })

      // Make a public fork
      await projectService.forkProject(user2, project3.id, {
        name: 'Forked Project'
      })

      const response = await app.inject({
        method: 'GET',
        url: `/project/${project3.id}/forks`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toHaveLength(1)
    })
  })
})
