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
  Authority,
  Environment,
  EventSeverity,
  EventSource,
  EventTriggerer,
  EventType,
  Project,
  ProjectAccessLevel,
  Workspace,
  WorkspaceRole
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
import { WorkspaceModule } from '@/workspace/workspace.module'
import { WorkspaceService } from '@/workspace/workspace.service'
import { WorkspaceRoleModule } from '@/workspace-role/workspace-role.module'
import { WorkspaceRoleService } from '@/workspace-role/workspace-role.service'
import { WorkspaceMembershipService } from '@/workspace-membership/workspace-membership.service'
import { WorkspaceMembershipModule } from '@/workspace-membership/workspace-membership.module'
import { HydratedEnvironment } from './environment.types'

describe('Environment Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let projectService: ProjectService
  let environmentService: EnvironmentService
  let userService: UserService
  let eventService: EventService
  let workspaceService: WorkspaceService
  let workspaceRoleService: WorkspaceRoleService
  let workspaceMembershipService: WorkspaceMembershipService
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
        VariableModule,
        WorkspaceModule,
        WorkspaceRoleModule,
        WorkspaceMembershipModule
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
    workspaceService = moduleRef.get(WorkspaceService)
    workspaceRoleService = moduleRef.get(WorkspaceRoleService)
    workspaceMembershipService = moduleRef.get(WorkspaceMembershipService)
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

    it('should add the environment to the workspace admin role', async () => {
      // Create an environment
      const environment = await environmentService.createEnvironment(
        user1,
        {
          name: 'Environment 3',
          description: 'Environment 3 description'
        },
        project1.slug
      )

      // Fetch the admin role
      const adminRole = await prisma.workspaceRole.findUnique({
        where: {
          workspaceId_name: {
            workspaceId: project1.workspaceId,
            name: 'Admin'
          }
        },
        include: {
          projects: {
            include: {
              environments: true
            }
          }
        }
      })

      const environmentSlugs = adminRole.projects[0].environments.map(
        (e) => e.slug
      )
      expect(environmentSlugs).toContain(environment.slug)
    })

    it('should not be able to create more environments if tier limit is reached', async () => {
      // Create the number of environments that the tier limit allows
      for (
        let x = 100;
        x < 100 + tierLimitService.getEnvironmentTierLimit(project1.id) - 2; // Subtract 2 for the environments created above
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
      const environment: HydratedEnvironment = response.json()

      expect(environment.name).toBe('Environment 1 Updated')
      expect(environment.description).toBe('Environment 1 description updated')
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
      expect(response.json().entitlements).toBeDefined()
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

  describe('Access Control tests', () => {
    let workspace: Workspace
    let project: Project
    let environment: Environment
    let role: WorkspaceRole

    beforeEach(async () => {
      // Create a workspace
      workspace = await workspaceService.createWorkspace(user1, {
        name: 'My workspace',
        icon: '🤓'
      })

      // Create a project
      project = await projectService.createProject(user1, workspace.slug, {
        name: 'My project',
        accessLevel: ProjectAccessLevel.PRIVATE
      })

      // Fetch the environment of the project
      environment = await prisma.environment.findFirst({
        where: {
          projectId: project.id
        }
      })

      // Create a role with full visibility to project and secrets
      role = await workspaceRoleService.createWorkspaceRole(
        user1,
        workspace.slug,
        {
          name: 'Role 1',
          authorities: [
            Authority.READ_ENVIRONMENT,
            Authority.READ_PROJECT,
            Authority.DELETE_ENVIRONMENT,
            Authority.UPDATE_ENVIRONMENT,
            Authority.CREATE_ENVIRONMENT
          ],
          projectEnvironments: [
            {
              projectSlug: project.slug,
              environmentSlugs: [environment.slug]
            }
          ]
        }
      )

      // Invite user 2 to the workspace
      await workspaceMembershipService.inviteUsersToWorkspace(
        user1,
        workspace.slug,
        [
          {
            email: user2.email,
            roleSlugs: [role.slug]
          }
        ]
      )

      // Accept the invitation
      await workspaceMembershipService.acceptInvitation(user2, workspace.slug)
    })

    it('should only be able to fetch environments the user has access to', async () => {
      // Create another environment in the project
      const environment2 = await environmentService.createEnvironment(
        user1,
        {
          name: 'Environment 2'
        },
        project.slug
      )

      // Fetch all environments of the project
      const response = await app.inject({
        method: 'GET',
        url: `/environment/all/${project.slug}?page=0&limit=10`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      const environmentData = response.json().items
      expect(environmentData).toHaveLength(1)

      // Update the role to give access to the 2nd environment
      await workspaceRoleService.updateWorkspaceRole(user1, role.slug, {
        projectEnvironments: [
          {
            projectSlug: project.slug,
            environmentSlugs: [environment.slug, environment2.slug]
          }
        ]
      })

      // Fetch all environments of the project
      const response2 = await app.inject({
        method: 'GET',
        url: `/environment/all/${project.slug}?page=0&limit=10`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      const environmentData2 = response2.json().items
      expect(environmentData2).toHaveLength(2)
    })

    it('should have the correct entitlements', async () => {
      // Fetch all environments of the project
      let response = await app.inject({
        method: 'GET',
        url: `/environment/all/${project.slug}?page=0&limit=10`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      let environmentData = response.json().items[0]
      expect(environmentData.entitlements).toEqual({
        canUpdate: true,
        canDelete: true
      })

      // Remove DELETE_ENVIRONMENT authority from the role
      await workspaceRoleService.updateWorkspaceRole(user1, role.slug, {
        authorities: [
          Authority.READ_ENVIRONMENT,
          Authority.READ_PROJECT,
          Authority.UPDATE_ENVIRONMENT,
          Authority.CREATE_ENVIRONMENT
        ]
      })

      // Fetch all environments of the project
      response = await app.inject({
        method: 'GET',
        url: `/environment/all/${project.slug}?page=0&limit=10`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      environmentData = response.json().items[0]
      expect(environmentData.entitlements).toEqual({
        canUpdate: true,
        canDelete: false
      })

      // Remove UPDATE_ENVIRONMENT authority from the role
      await workspaceRoleService.updateWorkspaceRole(user1, role.slug, {
        authorities: [
          Authority.READ_ENVIRONMENT,
          Authority.READ_PROJECT,
          Authority.CREATE_ENVIRONMENT
        ]
      })

      // Fetch all environments of the project
      response = await app.inject({
        method: 'GET',
        url: `/environment/all/${project.slug}?page=0&limit=10`,
        headers: {
          'x-e2e-user-email': user2.email
        }
      })

      environmentData = response.json().items[0]
      expect(environmentData.entitlements).toEqual({
        canUpdate: false,
        canDelete: false
      })
    })
  })
})
