import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { PrismaService } from '@/prisma/prisma.service'
import { Test } from '@nestjs/testing'
import { AppModule } from '@/app/app.module'
import { ProjectModule } from './project.module'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
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
  Variable,
  Workspace
} from '@prisma/client'
import { EventService } from '@/event/event.service'
import { EventModule } from '@/event/event.module'
import { ProjectService } from './project.service'
import { WorkspaceService } from '@/workspace/workspace.service'
import { WorkspaceMembershipService } from '@/workspace-membership/workspace-membership.service'
import { UserService } from '@/user/user.service'
import { WorkspaceModule } from '@/workspace/workspace.module'
import { WorkspaceMembershipModule } from '@/workspace-membership/workspace-membership.module'
import { UserModule } from '@/user/user.module'
import { WorkspaceRoleModule } from '@/workspace-role/workspace-role.module'
import { WorkspaceRoleService } from '@/workspace-role/workspace-role.service'
import { EnvironmentService } from '@/environment/environment.service'
import { SecretService } from '@/secret/secret.service'
import { VariableService } from '@/variable/variable.service'
import { VariableModule } from '@/variable/variable.module'
import { SecretModule } from '@/secret/secret.module'
import { EnvironmentModule } from '@/environment/environment.module'
import { QueryTransformPipe } from '@/common/pipes/query.transform.pipe'
import { fetchEvents } from '@/common/event'
import { AuthenticatedUser } from '@/user/user.types'
import { TierLimitService } from '@/common/tier-limit.service'

describe('Project Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let eventService: EventService
  let projectService: ProjectService
  let workspaceService: WorkspaceService
  let workspaceMembershipService: WorkspaceMembershipService
  let userService: UserService
  let workspaceRoleService: WorkspaceRoleService
  let environmentService: EnvironmentService
  let secretService: SecretService
  let variableService: VariableService
  let tierLimitService: TierLimitService

  let user1: AuthenticatedUser, user2: AuthenticatedUser
  let workspace1: Workspace, workspace2: Workspace
  let project1: Project, project2: Project, project3: Project, project4: Project

  const USER_IP_ADDRESS = '127.0.0.1'

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        ProjectModule,
        EventModule,
        WorkspaceModule,
        WorkspaceMembershipModule,
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
    workspaceMembershipService = moduleRef.get(WorkspaceMembershipService)
    userService = moduleRef.get(UserService)
    workspaceRoleService = moduleRef.get(WorkspaceRoleService)
    environmentService = moduleRef.get(EnvironmentService)
    secretService = moduleRef.get(SecretService)
    variableService = moduleRef.get(VariableService)
    tierLimitService = moduleRef.get(TierLimitService)

    app.useGlobalPipes(new QueryTransformPipe())

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

    workspace1 = createUser1.defaultWorkspace
    workspace2 = createUser2.defaultWorkspace

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

    project1 = await projectService.createProject(user1, workspace1.slug, {
      name: 'Project 1',
      description: 'Project 1 description',
      storePrivateKey: true
    })

    project2 = await projectService.createProject(user2, workspace2.slug, {
      name: 'Project 2',
      description: 'Project 2 description',
      storePrivateKey: false
    })

    project3 = await projectService.createProject(user1, workspace1.slug, {
      name: 'Project for fork',
      description: 'Project for fork',
      storePrivateKey: true,
      accessLevel: ProjectAccessLevel.GLOBAL
    })

    project4 = await projectService.createProject(user2, workspace2.slug, {
      name: 'Project4',
      description:
        'Project for testing if all environments,secrets and keys are being fetched or not',
      storePrivateKey: true
    })
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
    expect(eventService).toBeDefined()
    expect(projectService).toBeDefined()
    expect(workspaceService).toBeDefined()
    expect(workspaceMembershipService).toBeDefined()
    expect(userService).toBeDefined()
    expect(workspaceRoleService).toBeDefined()
    expect(environmentService).toBeDefined()
    expect(secretService).toBeDefined()
    expect(variableService).toBeDefined()
  })

  describe('Create Project Tests', () => {
    it('should allow workspace member to create a project', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/project/${workspace1.slug}`,
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
      expect(response.json().slug).toBeDefined()
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

    it('should not be able to create projects if tier limit it reached', async () => {
      // Create the number of projects that the tier limit allows
      for (
        let x = 100;
        x < 100 + tierLimitService.getProjectTierLimit(workspace1.id) - 2; // Subtract 2 for the projects created above
        x++
      ) {
        await projectService.createProject(user1, workspace1.slug, {
          name: `Project ${x}`,
          description: `Project ${x} description`,
          storePrivateKey: true
        })
      }

      const response = await app.inject({
        method: 'POST',
        url: `/project/${workspace1.slug}`,
        payload: {
          name: 'Project X',
          description: 'Project 101 description',
          storePrivateKey: true
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(400)
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
        url: `/project/${workspace1.slug}`,
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
    })

    it('should have created a PROJECT_CREATED event', async () => {
      const response = await fetchEvents(
        eventService,
        user1,
        workspace1.slug,
        EventSource.PROJECT
      )

      const event = response.items[0]

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
      expect(adminRole.projects).toContainEqual({ projectId: project1.id })
    })

    it('should not let non-member create a project', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/project/${workspace1.slug}`,
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
    })
  })

  describe('Update Project Tests', () => {
    it('should be able to update the name and description of a project', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/project/${project1.slug}`,
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
      expect(response.json().slug).not.toBe(project1.slug)
      expect(response.json().description).toBe('Project 1 description updated')
      expect(response.json().storePrivateKey).toBe(true)
      expect(response.json().workspaceId).toBe(workspace1.id)
      expect(response.json().lastUpdatedById).toBe(user1.id)
      expect(response.json().isDisabled).toBe(false)
      expect(response.json().accessLevel).toBe(ProjectAccessLevel.PRIVATE)
      expect(response.json().publicKey).toBe(project1.publicKey)
    })

    it('should not be able to update the name of a project to an existing name', async () => {
      await projectService.createProject(user1, workspace1.slug, {
        name: 'Existing Project',
        description: 'Existing Project description'
      })

      const response = await app.inject({
        method: 'PUT',
        url: `/project/${project1.slug}`,
        payload: {
          name: 'Existing Project'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(409)
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
    })

    it('should not be able to update a project if the user is not a member of the workspace', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/project/${project1.slug}`,
        payload: {
          name: 'Project 1 Updated',
          description: 'Project 1 description updated'
        },
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should have created a PROJECT_UPDATED event', async () => {
      await projectService.updateProject(user1, project1.slug, {
        name: 'Project 1 Updated',
        description: 'Project 1 description'
      })

      const response = await fetchEvents(
        eventService,
        user1,
        workspace1.slug,
        EventSource.PROJECT
      )

      const event = response.items[0]

      expect(event.source).toBe(EventSource.PROJECT)
      expect(event.triggerer).toBe(EventTriggerer.USER)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.PROJECT_UPDATED)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBe(project1.id)
    })
  })

  describe('Get Project Tests', () => {
    it('should be able to fetch a project by its slug', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/project/${project1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)

      const project = response.json()
      expect(project.id).toBe(project1.id)
      expect(project.name).toBe(project1.name)
      expect(project.slug).toBe(project1.slug)
      expect(project.description).toBe(project1.description)
      expect(project.storePrivateKey).toBe(project1.storePrivateKey)
      expect(project.workspaceId).toBe(project1.workspaceId)
      expect(project.lastUpdatedById).toBe(project1.lastUpdatedById)
      expect(project.isDisabled).toBe(project1.isDisabled)
      expect(project.accessLevel).toBe(project1.accessLevel)
      expect(project.publicKey).toBe(project1.publicKey)
      expect(project.privateKey).toBe(project1.privateKey)
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
    })

    it('should not be able to fetch a project if the user is not a member of the workspace', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/project/${project1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should fetch correct counts of environments, variables, and secrets for projects in a workspace', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/project/${project1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      const project = response.json()
      expect(project.environmentCount).toEqual(1)
      expect(project.variableCount).toEqual(0)
      expect(project.secretCount).toEqual(0)
    })
  })

  describe('Get All Projects Tests', () => {
    it('should be able to fetch all projects of a workspace', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/project/all/${workspace1.slug}?page=0&limit=10`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().items.length).toEqual(2)

      const projectJson = response.json().items[0]
      expect(projectJson).toHaveProperty('maxAllowedEnvironments')
      expect(projectJson).toHaveProperty('maxAllowedVariables')
      expect(projectJson).toHaveProperty('maxAllowedSecrets')
      expect(projectJson).toHaveProperty('totalEnvironments')
      expect(projectJson).toHaveProperty('totalVariables')
      expect(projectJson).toHaveProperty('totalSecrets')

      //check metadata
      const metadata = response.json().metadata
      expect(metadata.totalCount).toEqual(2)
      expect(metadata.links.self).toBe(
        `/project/all/${workspace1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.first).toBe(
        `/project/all/${workspace1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.previous).toEqual(null)
      expect(metadata.links.next).toEqual(null)
      expect(metadata.links.last).toBe(
        `/project/all/${workspace1.slug}?page=0&limit=10&sort=name&order=asc&search=`
      )
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
    })

    it('should not be able to fetch all projects of a workspace if the user is not a member of the workspace', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/project/all/${workspace1.slug}`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should fetch correct counts of environments, variables, and secrets for projects in a workspace', async () => {
      // Add an environment to the project
      const environment = (await environmentService.createEnvironment(
        user2,
        {
          name: 'Dev'
        },
        project4.slug
      )) as Environment

      // Add two secrets
      ;(
        await secretService.createSecret(
          user2,
          {
            name: 'API_KEY',
            entries: [
              {
                value: 'some_key',
                environmentSlug: environment.slug
              }
            ]
          },
          project4.slug
        )
      ).secret as Secret
      ;(
        await secretService.createSecret(
          user2,
          {
            name: 'DB_PASSWORD',
            entries: [
              {
                value: 'password',
                environmentSlug: environment.slug
              }
            ]
          },
          project4.slug
        )
      ).secret as Secret

      // Add two variables
      ;(
        await variableService.createVariable(
          user2,
          {
            name: 'PORT',
            entries: [
              {
                value: '8080',
                environmentSlug: environment.slug
              }
            ]
          },
          project4.slug
        )
      ).variable as Variable
      ;(
        await variableService.createVariable(
          user2,
          {
            name: 'EXPIRY',
            entries: [
              {
                value: '3600',
                environmentSlug: environment.slug
              }
            ]
          },
          project4.slug
        )
      ).variable as Variable

      const response = await app.inject({
        method: 'GET',
        url: `/project/all/${workspace2.slug}?page=0&limit=10&search=Project4`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().items.length).toEqual(1)

      const project = response.json().items[0]
      expect(project.environmentCount).toEqual(2)
      expect(project.variableCount).toEqual(2)
      expect(project.secretCount).toEqual(2)
      // Verify project details
      expect(project.name).toEqual('Project4')
      expect(project.description).toEqual(
        'Project for testing if all environments,secrets and keys are being fetched or not'
      )
      // Verify that sensitive data is not included
      expect(project).not.toHaveProperty('privateKey')
      expect(project).not.toHaveProperty('publicKey')
    })
  })

  it('should create environments if provided', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/project/${workspace1.slug}`,
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

  describe('Key Tests', () => {
    it('should not store the private key if storePrivateKey is false', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/project/${workspace1.slug}`,
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

    it('should generate new key-pair if regenerateKeyPair is true and and the project stores the private key or a private key is specified', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/project/${project1.slug}`,
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
        url: `/project/${project2.slug}`,
        payload: {
          regenerateKeyPair: true
        },
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('Delete Project Tests', () => {
    it('should be able to delete a project', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/project/${project1.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
    })

    it('should have created a PROJECT_DELETED event', async () => {
      await projectService.deleteProject(user1, project1.slug)

      const response = await fetchEvents(
        eventService,
        user1,
        workspace1.slug,
        EventSource.PROJECT
      )

      const event = response.items[0]

      expect(event.source).toBe(EventSource.PROJECT)
      expect(event.triggerer).toBe(EventTriggerer.USER)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.PROJECT_DELETED)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBe(project1.id)
    })

    it('should have removed all environments of the project', async () => {
      await projectService.deleteProject(user1, project1.slug)

      const environments = await prisma.environment.findMany({
        where: {
          projectId: project1.id
        }
      })

      expect(environments).toHaveLength(0)
    })

    it('should have removed the project from the admin role of the workspace', async () => {
      await projectService.deleteProject(user1, project1.slug)

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
    })

    it('should not be able to delete a project if the user is not a member of the workspace', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/project/${project2.slug}`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Project Access Level Tests', () => {
    let globalProject: Project, internalProject: Project

    beforeEach(async () => {
      globalProject = (await projectService.createProject(
        user1,
        workspace1.slug,
        {
          name: 'Global Project',
          description: 'Global Project description',
          storePrivateKey: true,
          accessLevel: ProjectAccessLevel.GLOBAL
        }
      )) as Project

      internalProject = (await projectService.createProject(
        user1,
        workspace1.slug,
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
        url: `/project/${globalProject.slug}`,
        headers: {
          'x-e2e-user-email': user2.email // user2 is not a member of workspace1
        }
      })

      expect(response.statusCode).toBe(200)

      const project = response.json()
      expect(project.id).toBe(globalProject.id)
      expect(project.name).toBe(globalProject.name)
      expect(project.slug).toBe(globalProject.slug)
      expect(project.description).toBe(globalProject.description)
      expect(project.storePrivateKey).toBe(globalProject.storePrivateKey)
      expect(project.workspaceId).toBe(globalProject.workspaceId)
      expect(project.lastUpdatedById).toBe(globalProject.lastUpdatedById)
      expect(project.isDisabled).toBe(globalProject.isDisabled)
      expect(project.accessLevel).toBe(globalProject.accessLevel)
      expect(project.publicKey).toBe(globalProject.publicKey)
      expect(project.privateKey).toBe(globalProject.privateKey)
      expect(project.environmentCount).toBe(1)
      expect(project.secretCount).toBe(0)
      expect(project.variableCount).toBe(0)
    })

    it('should allow workspace members with READ_PROJECT to access an internal project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/project/${internalProject.slug}`,
        headers: {
          'x-e2e-user-email': user1.email // user1 is a member of workspace1
        }
      })

      expect(response.statusCode).toBe(200)

      const project = response.json()
      expect(project.id).toBe(internalProject.id)
      expect(project.name).toBe(internalProject.name)
      expect(project.slug).toBe(internalProject.slug)
      expect(project.description).toBe(internalProject.description)
      expect(project.storePrivateKey).toBe(internalProject.storePrivateKey)
      expect(project.workspaceId).toBe(internalProject.workspaceId)
      expect(project.lastUpdatedById).toBe(internalProject.lastUpdatedById)
      expect(project.isDisabled).toBe(internalProject.isDisabled)
      expect(project.accessLevel).toBe(internalProject.accessLevel)
      expect(project.publicKey).toBe(internalProject.publicKey)
      expect(project.privateKey).toBe(internalProject.privateKey)
      expect(project.environmentCount).toBe(1)
      expect(project.secretCount).toBe(0)
      expect(project.variableCount).toBe(0)
    })

    it('should not allow non-members to access an internal project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/project/${internalProject.slug}`,
        headers: {
          'x-e2e-user-email': user2.email // user2 is not a member of workspace1
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not allow outsiders to update a GLOBAL project', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/project/${globalProject.slug}`,
        payload: {
          name: 'Global Project Updated'
        },
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should store private key even if specified not to in a global project', async () => {
      const project = (await projectService.createProject(
        user1,
        workspace1.slug,
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
      const user = await userService.createUser({
        name: 'Johnny Doe',
        email: 'johhny@keyshade.xyz',
        isOnboardingFinished: true,
        isActive: true,
        isAdmin: false
      })

      const johnny: AuthenticatedUser = {
        ...user,
        ipAddress: USER_IP_ADDRESS,
        emailPreference: {
          id: expect.any(String),
          userId: user.id,
          marketing: true,
          activity: true,
          critical: true,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      }

      // Create a member role for the workspace
      const role = await workspaceRoleService.createWorkspaceRole(
        user1,
        workspace1.slug,
        {
          name: 'Member',
          authorities: [Authority.READ_PROJECT]
        }
      )

      // Add user to workspace as a member
      await workspaceMembershipService.inviteUsersToWorkspace(
        user1,
        workspace1.slug,
        [
          {
            email: johnny.email,
            roleSlugs: [role.slug]
          }
        ]
      )

      // Accept the invitation on behalf of the user
      await workspaceMembershipService.acceptInvitation(johnny, workspace1.slug)

      // Update the access level of the project
      const response = await app.inject({
        method: 'PUT',
        url: `/project/${internalProject.slug}`,
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
        workspace1.slug,
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
        project.slug,
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
        workspace1.slug,
        {
          name: 'Internal Project 2',
          description: 'Internal Project description',
          storePrivateKey: false,
          accessLevel: ProjectAccessLevel.INTERNAL
        }
      )) as Project

      const response = await app.inject({
        method: 'PUT',
        url: `/project/${project.slug}`,
        payload: {
          accessLevel: ProjectAccessLevel.GLOBAL
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(400)
    })

    it('should regenerate key-pair if access level of GLOBAL project is updated to INTERNAL or PRIVATE', async () => {
      const project = (await projectService.createProject(
        user1,
        workspace1.slug,
        {
          name: 'Global Project 2',
          description: 'Global Project description',
          storePrivateKey: true,
          accessLevel: ProjectAccessLevel.GLOBAL
        }
      )) as Project

      const response = await app.inject({
        method: 'PUT',
        url: `/project/${project.slug}`,
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
      workspace1.slug,
      {
        name: 'Private Project',
        description: 'Private Project description',
        storePrivateKey: true,
        accessLevel: ProjectAccessLevel.PRIVATE
      }
    )) as Project

    const response = await app.inject({
      method: 'GET',
      url: `/project/${privateProject.slug}`,
      headers: {
        'x-e2e-user-email': user1.email
      }
    })

    expect(response.statusCode).toBe(200)

    const project = response.json()
    expect(project.id).toBe(privateProject.id)
    expect(project.name).toBe(privateProject.name)
    expect(project.slug).toBe(privateProject.slug)
    expect(project.description).toBe(privateProject.description)
    expect(project.storePrivateKey).toBe(privateProject.storePrivateKey)
    expect(project.workspaceId).toBe(privateProject.workspaceId)
    expect(project.lastUpdatedById).toBe(privateProject.lastUpdatedById)
    expect(project.isDisabled).toBe(privateProject.isDisabled)
    expect(project.accessLevel).toBe(privateProject.accessLevel)
    expect(project.publicKey).toBe(privateProject.publicKey)
    expect(project.privateKey).toBe(privateProject.privateKey)
  })

  it('should not allow users without sufficient access to access a private project', async () => {
    const privateProject = await projectService.createProject(
      user1,
      workspace1.slug,
      {
        name: 'Private Project',
        description: 'Private Project description',
        storePrivateKey: true,
        accessLevel: ProjectAccessLevel.PRIVATE
      }
    )

    const response = await app.inject({
      method: 'GET',
      url: `/project/${privateProject.slug}`,
      headers: {
        'x-e2e-user-email': user2.email // user2 is not a member of workspace1
      }
    })

    expect(response.statusCode).toBe(401)
  })

  describe('Project Fork Tests', () => {
    it('should be able to fork a project', async () => {
      const forkedProject = (await projectService.forkProject(
        user2,
        project3.slug,
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
    })

    it('should not be able to fork a project that is not GLOBAL', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/project/${project2.slug}/fork`,
        payload: {
          name: 'Forked Project'
        },
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should fork the project in the default workspace if workspace slug is not specified', async () => {
      const forkedProject = (await projectService.forkProject(
        user2,
        project3.slug,
        {
          name: 'Forked Project'
        }
      )) as Project

      expect(forkedProject.workspaceId).toBe(workspace2.id)
    })

    it('should fork the project in the specific workspace if the slug is provided in the payload', async () => {
      const newWorkspace = (await workspaceService.createWorkspace(user2, {
        name: 'New Workspace'
      })) as Workspace

      const forkedProject = (await projectService.forkProject(
        user2,
        project3.slug,
        {
          name: 'Forked Project',
          workspaceSlug: newWorkspace.slug
        }
      )) as Project

      expect(forkedProject.workspaceId).toBe(newWorkspace.id)
    })

    it('should not be able to create a fork with the same name in a workspace', async () => {
      await projectService.createProject(user2, workspace2.slug, {
        name: 'Forked Project',
        description: 'Forked Project description',
        storePrivateKey: true,
        accessLevel: ProjectAccessLevel.GLOBAL
      })

      const response = await app.inject({
        method: 'POST',
        url: `/project/${project3.slug}/fork`,
        payload: {
          name: 'Forked Project'
        },
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      expect(response.statusCode).toBe(409)
    })

    it('should copy over all environments, secrets and variables into the forked project', async () => {
      // Add an environment to the project
      const environment = (await environmentService.createEnvironment(
        user1,
        {
          name: 'Dev'
        },
        project3.slug
      )) as Environment

      // Add two secrets
      const secret1 = (
        await secretService.createSecret(
          user1,
          {
            name: 'API_KEY',
            entries: [
              {
                value: 'some_key',
                environmentSlug: environment.slug
              }
            ]
          },
          project3.slug
        )
      ).secret as Secret

      const secret2 = (
        await secretService.createSecret(
          user1,
          {
            name: 'DB_PASSWORD',
            entries: [
              {
                value: 'password',
                environmentSlug: environment.slug
              }
            ]
          },
          project3.slug
        )
      ).secret as Secret

      // Add two variables
      const variable1 = (
        await variableService.createVariable(
          user1,
          {
            name: 'PORT',
            entries: [
              {
                value: '8080',
                environmentSlug: environment.slug
              }
            ]
          },
          project3.slug
        )
      ).variable as Variable

      const variable2 = (
        await variableService.createVariable(
          user1,
          {
            name: 'EXPIRY',
            entries: [
              {
                value: '3600',
                environmentSlug: environment.slug
              }
            ]
          },
          project3.slug
        )
      ).variable as Variable

      // Try forking the project
      const forkedProject = await projectService.forkProject(
        user2,
        project3.slug,
        {
          name: 'Forked Project'
        }
      )

      // Fetch the environments of the forked project
      // (there will be 2 because a default environment is always created)
      const forkedEnvironments = await prisma.environment.findMany({
        where: {
          projectId: forkedProject.id
        },
        orderBy: {
          name: 'asc'
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
      expect(defaultEnvironment.name).toBe('default')
    })

    it('should only copy new environments, secrets and variables if sync is not hard', async () => {
      // Add an environment to the project
      const environment = (await environmentService.createEnvironment(
        user1,
        {
          name: 'Dev'
        },
        project3.slug
      )) as Environment

      // Add two secrets
      await secretService.createSecret(
        user1,
        {
          name: 'API_KEY',
          entries: [
            {
              value: 'some_key',
              environmentSlug: environment.slug
            }
          ]
        },
        project3.slug
      )

      await secretService.createSecret(
        user1,
        {
          name: 'DB_PASSWORD',
          entries: [
            {
              value: 'password',
              environmentSlug: environment.slug
            }
          ]
        },
        project3.slug
      )

      // Add two variables
      await variableService.createVariable(
        user1,
        {
          name: 'PORT',
          entries: [
            {
              value: '8080',
              environmentSlug: environment.slug
            }
          ]
        },
        project3.slug
      )

      await variableService.createVariable(
        user1,
        {
          name: 'EXPIRY',
          entries: [
            {
              value: '3600',
              environmentSlug: environment.slug
            }
          ]
        },
        project3.slug
      )

      // Try forking the project
      const forkedProject = await projectService.forkProject(
        user2,
        project3.slug,
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
          project3.slug
        )) as Environment

      // Add a new secret to the original project
      await secretService.createSecret(
        user1,
        {
          name: 'NEW_SECRET',
          entries: [
            {
              value: 'new_secret',
              environmentSlug: newEnvironmentOriginal.slug
            }
          ]
        },
        project3.slug
      )

      // Add a new variable to the original project
      await variableService.createVariable(
        user1,
        {
          name: 'NEW_VARIABLE',
          entries: [
            {
              value: 'new_variable',
              environmentSlug: newEnvironmentOriginal.slug
            }
          ]
        },
        project3.slug
      )

      // Add a new environment to the forked project
      const newEnvironmentForked = (await environmentService.createEnvironment(
        user2,
        {
          name: 'Stage'
        },
        forkedProject.slug
      )) as Environment

      // Add a new secret to the forked project
      await secretService.createSecret(
        user2,
        {
          name: 'NEW_SECRET_2',
          entries: [
            {
              value: 'new_secret',
              environmentSlug: newEnvironmentForked.slug
            }
          ]
        },
        forkedProject.slug
      )

      // Add a new variable to the forked project
      await variableService.createVariable(
        user2,
        {
          name: 'NEW_VARIABLE_2',
          entries: [
            {
              value: 'new_variable',
              environmentSlug: newEnvironmentForked.slug
            }
          ]
        },
        forkedProject.slug
      )

      // Sync the fork
      await app.inject({
        method: 'PUT',
        url: `/project/${forkedProject.slug}/fork`,
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

      expect(forkedSecrets).toHaveLength(4)
      expect(forkedVariables).toHaveLength(4)
      expect(forkedEnvironments).toHaveLength(4)
    })

    it('should only replace environments, secrets and variables if sync is hard', async () => {
      const environment = (await environmentService.createEnvironment(
        user1,
        {
          name: 'Dev'
        },
        project3.slug
      )) as Environment

      // Add two secrets
      await secretService.createSecret(
        user1,
        {
          name: 'API_KEY',
          entries: [
            {
              value: 'some_key',
              environmentSlug: environment.slug
            }
          ]
        },
        project3.slug
      )

      await secretService.createSecret(
        user1,
        {
          name: 'DB_PASSWORD',
          entries: [
            {
              value: 'password',
              environmentSlug: environment.slug
            }
          ]
        },
        project3.slug
      )

      // Add two variables
      await variableService.createVariable(
        user1,
        {
          name: 'PORT',
          entries: [
            {
              value: '8080',
              environmentSlug: environment.slug
            }
          ]
        },
        project3.slug
      )

      await variableService.createVariable(
        user1,
        {
          name: 'EXPIRY',
          entries: [
            {
              value: '3600',
              environmentSlug: environment.slug
            }
          ]
        },
        project3.slug
      )

      // Try forking the project
      const forkedProject = await projectService.forkProject(
        user2,
        project3.slug,
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
          project3.slug
        )) as Environment

      // Add a new secret to the original project
      await secretService.createSecret(
        user1,
        {
          name: 'NEW_SECRET',
          entries: [
            {
              value: 'new_secret',
              environmentSlug: newEnvironmentOriginal.slug
            }
          ]
        },
        project3.slug
      )

      // Add a new variable to the original project
      await variableService.createVariable(
        user1,
        {
          name: 'NEW_VARIABLE',
          entries: [
            {
              value: 'new_variable',
              environmentSlug: newEnvironmentOriginal.slug
            }
          ]
        },
        project3.slug
      )

      // Add a new environment to the forked project
      const newEnvironmentForked = (await environmentService.createEnvironment(
        user2,
        {
          name: 'Prod'
        },
        forkedProject.slug
      )) as Environment

      // Add a new secret to the forked project
      await secretService.createSecret(
        user2,
        {
          name: 'NEW_SECRET',
          entries: [
            {
              value: 'new_secret',
              environmentSlug: newEnvironmentForked.slug
            }
          ]
        },
        forkedProject.slug
      )

      // Add a new variable to the forked project
      await variableService.createVariable(
        user2,
        {
          name: 'NEW_VARIABLE',
          entries: [
            {
              value: 'new_variable',
              environmentSlug: newEnvironmentForked.slug
            }
          ]
        },
        forkedProject.slug
      )

      // Sync the fork
      await app.inject({
        method: 'PUT',
        url: `/project/${forkedProject.slug}/fork?hardSync=true`,
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
        url: `/project/${project3.slug}/fork`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(400)
    })

    it('should be able to unlink a forked project', async () => {
      const forkedProject = await projectService.forkProject(
        user2,
        project3.slug,
        {
          name: 'Forked Project'
        }
      )

      const response = await app.inject({
        method: 'DELETE',
        url: `/project/${forkedProject.slug}/fork`,
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
      await projectService.forkProject(user2, project3.slug, {
        name: 'Forked Project'
      })

      const response = await app.inject({
        method: 'GET',
        url: `/project/${project3.slug}/forks`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })
      expect(response.statusCode).toBe(200)
      expect(response.json().items).toHaveLength(1)

      //check metadata
      const metadata = response.json().metadata
      expect(metadata.links.self).toBe(
        `/project/${project3.slug}/forks?page=0&limit=10`
      )
      expect(metadata.links.first).toBe(
        `/project/${project3.slug}/forks?page=0&limit=10`
      )
      expect(metadata.links.previous).toEqual(null)
      expect(metadata.links.next).toEqual(null)
      expect(metadata.links.last).toBe(
        `/project/${project3.slug}/forks?page=0&limit=10`
      )
    })

    it('should not contain a forked project that has access level other than GLOBAL', async () => {
      // Make a hidden fork
      const hiddenProject = await projectService.forkProject(
        user2,
        project3.slug,
        {
          name: 'Hidden Forked Project'
        }
      )
      await projectService.updateProject(user2, hiddenProject.slug, {
        accessLevel: ProjectAccessLevel.INTERNAL
      })

      // Make a public fork
      await projectService.forkProject(user2, project3.slug, {
        name: 'Forked Project'
      })

      const response = await app.inject({
        method: 'GET',
        url: `/project/${project3.slug}/forks`,
        headers: {
          'x-e2e-user-email': user1.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().items).toHaveLength(1)
    })
  })

  describe('Export Configurations Tests', () => {
    let env: Environment, envNoPrivateKey: Environment

    beforeEach(async () => {
      env = (await environmentService.createEnvironment(
        user1,
        { name: 'EnvProj1' },
        project1.slug
      )) as Environment

      await secretService.createSecret(
        user1,
        {
          name: 'API_KEY',
          entries: [{ value: 'secret_val', environmentSlug: env.slug }]
        },
        project1.slug
      )

      await variableService.createVariable(
        user1,
        {
          name: 'TIMEOUT',
          entries: [{ value: '3000', environmentSlug: env.slug }]
        },
        project1.slug
      )

      envNoPrivateKey = (await environmentService.createEnvironment(
        user2,
        { name: 'EnvProj2' },
        project2.slug
      )) as Environment

      await secretService.createSecret(
        user2,
        {
          name: 'API_KEY',
          entries: [
            { value: 'secret_val', environmentSlug: envNoPrivateKey.slug }
          ]
        },
        project2.slug
      )

      await variableService.createVariable(
        user2,
        {
          name: 'TIMEOUT',
          entries: [{ value: '3000', environmentSlug: envNoPrivateKey.slug }]
        },
        project2.slug
      )
    })

    describe('Success cases', () => {
      it('should export project configurations as base64-JSON', async () => {
        const url =
          `/project/${project1.slug}/export-configurations` +
          `?environmentSlugs=${env.slug}` +
          `&format=json`

        const response = await app.inject({
          method: 'GET',
          url,
          headers: { 'x-e2e-user-email': user1.email }
        })

        expect(response.statusCode).toBe(200)

        const body = response.json()
        expect(body).toHaveProperty(env.slug)

        const raw = Buffer.from(body[env.slug], 'base64').toString('utf-8')
        const parsed = JSON.parse(raw)
        expect(parsed).toEqual({
          API_KEY: expect.not.stringMatching('secret_val'),
          TIMEOUT: '3000'
        })
      })

      it('should 200 if privateKey is missing but the project stores the private key', async () => {
        const url =
          `/project/${project1.slug}/export-configurations` +
          `?environmentSlugs=${env.slug}` +
          `&format=json`

        const response = await app.inject({
          method: 'GET',
          url,
          headers: { 'x-e2e-user-email': user1.email }
        })

        expect(response.statusCode).toBe(200)
      })
    })

    describe('Error cases', () => {
      it('should 401 if user is not a workspace member', async () => {
        const url =
          `/project/${project1.slug}/export-configurations` +
          `?environmentSlugs=${env.slug}` +
          `&format=json` +
          `&privateKey=${project1.privateKey}`

        const response = await app.inject({
          method: 'GET',
          url,
          headers: { 'x-e2e-user-email': user2.email }
        })

        expect(response.statusCode).toBe(401)
      })

      it('should 404 if project does not exist', async () => {
        const url =
          `/project/not-a-real-slug/export-configurations` +
          `?environmentSlugs=${env.slug}` +
          `&format=json` +
          `&privateKey=${project1.privateKey}`

        const response = await app.inject({
          method: 'GET',
          url,
          headers: { 'x-e2e-user-email': user1.email }
        })

        expect(response.statusCode).toBe(404)
      })
    })
  })
})
