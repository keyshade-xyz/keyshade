import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { PrismaService } from '@/prisma/prisma.service'
import { AppModule } from '@/app/app.module'
import { WorkspaceModule } from './workspace.module'
import { Test } from '@nestjs/testing'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
import {
  Authority,
  EventSeverity,
  EventSource,
  EventTriggerer,
  EventType,
  ProjectAccessLevel,
  User,
  Workspace,
  WorkspaceRole
} from '@prisma/client'
import { EventService } from '@/event/service/event.service'
import { EventModule } from '@/event/event.module'
import { UserModule } from '@/user/user.module'
import { UserService } from '@/user/service/user.service'
import { WorkspaceService } from './service/workspace.service'
import { QueryTransformPipe } from '@/common/pipes/query.transform.pipe'
import { ProjectModule } from '@/project/project.module'
import { EnvironmentModule } from '@/environment/environment.module'
import { SecretModule } from '@/secret/secret.module'
import { VariableModule } from '@/variable/variable.module'
import { ProjectService } from '@/project/service/project.service'
import { EnvironmentService } from '@/environment/service/environment.service'
import { SecretService } from '@/secret/service/secret.service'
import { VariableService } from '@/variable/service/variable.service'
import { WorkspaceRoleService } from '@/workspace-role/service/workspace-role.service'
import { WorkspaceRoleModule } from '@/workspace-role/workspace-role.module'
import { WorkspaceMembershipService } from '@/workspace-membership/service/workspace-membership.service'
import { WorkspaceMembershipModule } from '@/workspace-membership/workspace-membership.module'
import { fetchEvents } from '@/common/event'

const createMembership = async (
  roleId: string,
  userId: string,
  workspaceId: string,
  prisma: PrismaService
) => {
  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspaceId,
      userId: userId,
      roles: {
        create: {
          role: {
            connect: {
              id: roleId
            }
          }
        }
      }
    }
  })
}

describe('Workspace Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let eventService: EventService
  let userService: UserService
  let workspaceService: WorkspaceService
  let projectService: ProjectService
  let environmentService: EnvironmentService
  let secretService: SecretService
  let variableService: VariableService
  let workspaceRoleService: WorkspaceRoleService
  let workspaceMembershipService: WorkspaceMembershipService

  let user1: User, user2: User
  let workspace1: Workspace, workspace2: Workspace
  let adminRole: WorkspaceRole, memberRole: WorkspaceRole

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        WorkspaceModule,
        EventModule,
        UserModule,
        ProjectModule,
        EnvironmentModule,
        SecretModule,
        VariableModule,
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
    eventService = moduleRef.get(EventService)
    userService = moduleRef.get(UserService)
    workspaceService = moduleRef.get(WorkspaceService)
    projectService = moduleRef.get(ProjectService)
    environmentService = moduleRef.get(EnvironmentService)
    secretService = moduleRef.get(SecretService)
    variableService = moduleRef.get(VariableService)
    workspaceRoleService = moduleRef.get(WorkspaceRoleService)
    workspaceMembershipService = moduleRef.get(WorkspaceMembershipService)

    app.useGlobalPipes(new QueryTransformPipe())

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  beforeEach(async () => {
    const createUser1 = await userService.createUser({
      email: 'john@keyshade.xyz',
      name: 'John Doe',
      isOnboardingFinished: true
    })

    const createUser2 = await userService.createUser({
      email: 'jane@keyshade.xyz',
      name: 'Jane Doe',
      isOnboardingFinished: true
    })

    const createUser3 = await userService.createUser({
      email: 'sadie@keyshade.xyz',
      name: 'Sadie',
      isOnboardingFinished: true
    })

    workspace1 = createUser1.defaultWorkspace
    workspace2 = createUser2.defaultWorkspace

    delete createUser1.defaultWorkspace
    delete createUser2.defaultWorkspace
    delete createUser3.defaultWorkspace

    user1 = createUser1
    user2 = createUser2

    memberRole = await prisma.workspaceRole.create({
      data: {
        name: 'Member',
        slug: 'member',
        workspaceId: workspace1.id,
        authorities: [Authority.READ_WORKSPACE]
      }
    })

    adminRole = await prisma.workspaceRole.findUnique({
      where: {
        workspaceId_name: {
          workspaceId: workspace1.id,
          name: 'Admin'
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

  it('should be defined', async () => {
    expect(app).toBeDefined()
    expect(prisma).toBeDefined()
    expect(eventService).toBeDefined()
    expect(userService).toBeDefined()
    expect(workspaceService).toBeDefined()
    expect(projectService).toBeDefined()
    expect(environmentService).toBeDefined()
    expect(secretService).toBeDefined()
    expect(variableService).toBeDefined()
    expect(workspaceRoleService).toBeDefined()
    expect(workspaceMembershipService).toBeDefined()
  })

  describe('Create Workspace Tests', () => {
    it('should be able to create a new workspace', async () => {
      const response = await app.inject({
        method: 'POST',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: '/workspace',
        payload: {
          name: 'Workspace 1',
          icon: '🤓'
        }
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()

      expect(body.name).toBe('Workspace 1')
      expect(body.slug).toBeDefined()
      expect(body.icon).toBe('🤓')
      expect(body.ownerId).toBe(user1.id)
      expect(body.isFreeTier).toBe(true)
      expect(body.isDefault).toBe(false)
    })

    it('should not be able to create a workspace with the same name', async () => {
      const response = await app.inject({
        method: 'POST',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: '/workspace',
        payload: {
          name: 'My Workspace',
          icon: '🤓'
        }
      })

      expect(response.statusCode).toBe(409)
      expect(response.json()).toEqual({
        statusCode: 409,
        error: 'Conflict',
        message: 'Workspace already exists'
      })
    })

    it('should let other user to create workspace with same name', async () => {
      await workspaceService.createWorkspace(user1, {
        name: 'Workspace 1',
        icon: '🤓'
      })

      const response = await app.inject({
        method: 'POST',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: '/workspace',
        payload: {
          name: 'Workspace 1',
          icon: '🤓'
        }
      })

      expect(response.statusCode).toBe(201)
      workspace2 = response.json()

      expect(workspace2.name).toBe('Workspace 1')
      expect(workspace2.icon).toBe('🤓')
      expect(workspace2.ownerId).toBe(user2.id)
      expect(workspace2.isFreeTier).toBe(true)
      expect(workspace2.isDefault).toBe(false)
    })

    it('should have created a WORKSPACE_CREATED event', async () => {
      const response = await fetchEvents(
        eventService,
        user1,
        workspace1.slug,
        EventSource.WORKSPACE
      )

      const event = response.items[0]

      expect(event).toBeDefined()
      expect(event.source).toBe(EventSource.WORKSPACE)
      expect(event.triggerer).toBe(EventTriggerer.USER)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.WORKSPACE_CREATED)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBeDefined()
    })

    it('should have created a new role with name Admin', async () => {
      expect(adminRole).toBeDefined()
      expect(adminRole).toEqual({
        id: expect.any(String),
        name: 'Admin',
        slug: expect.any(String),
        description: null,
        colorCode: expect.any(String),
        authorities: [Authority.WORKSPACE_ADMIN],
        hasAdminAuthority: true,
        workspaceId: workspace1.id,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      })
    })

    it('should have associated the admin role with the user', async () => {
      const userRole = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            userId: user1.id,
            workspaceId: workspace1.id
          }
        }
      })

      expect(userRole).toBeDefined()
      expect(userRole).toEqual({
        id: expect.any(String),
        userId: user1.id,
        workspaceId: workspace1.id,
        invitationAccepted: true,
        createdOn: expect.any(Date)
      })
    })
  })

  describe('Update Workspace Tests', () => {
    it('should be able to update the workspace', async () => {
      const response = await app.inject({
        method: 'PUT',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace/${workspace1.slug}`,
        payload: {
          name: 'Workspace 1 Updated',
          icon: '🔥'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()

      expect(body.name).toBe('Workspace 1 Updated')
      expect(body.slug).not.toBe(workspace1.slug)
      expect(body.icon).toBe('🔥')
    })

    it('should not be able to change the name to an existing workspace or same name', async () => {
      const response = await app.inject({
        method: 'PUT',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace/${workspace1.slug}`,
        payload: {
          name: 'My Workspace'
        }
      })

      expect(response.statusCode).toBe(409)
      expect(response.json()).toEqual({
        statusCode: 409,
        error: 'Conflict',
        message: 'Workspace already exists'
      })
    })

    it('should not allow external user to update a workspace', async () => {
      const response = await app.inject({
        method: 'PUT',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace/${workspace1.slug}`,
        payload: {
          name: 'Workspace 1 Updated',
          icon: '🤓'
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should have created a WORKSPACE_UPDATED event', async () => {
      await workspaceService.updateWorkspace(user1, workspace1.slug, {
        icon: '🤓'
      })

      const response = await fetchEvents(
        eventService,
        user1,
        workspace1.slug,
        EventSource.WORKSPACE
      )

      const event = response.items[0]

      expect(event).toBeDefined()
      expect(event.source).toBe(EventSource.WORKSPACE)
      expect(event.triggerer).toBe(EventTriggerer.USER)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.WORKSPACE_UPDATED)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBeDefined()
    })
  })

  describe('Get Workspace Tests', () => {
    it('should be able to fetch the workspace by slug', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace/${workspace1.slug}`
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().name).toEqual(workspace1.name)
    })

    it('should not be able to fetch the workspace by slug if user is not a member', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace/${workspace1.slug}`
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Get All Workspace Of User Tests', () => {
    it('should be able to fetch all the workspaces the user is a member of', async () => {
      await createMembership(memberRole.id, user2.id, workspace1.id, prisma)
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: '/workspace'
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().items.length).toEqual(2)

      //check metadata
      const metadata = response.json().metadata
      expect(metadata.totalCount).toBe(2)
      expect(metadata.links.self).toEqual(
        `/workspace?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.first).toEqual(
        `/workspace?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.previous).toBeNull()
      expect(metadata.links.next).toBeNull()
      expect(metadata.links.last).toEqual(
        `/workspace?page=0&limit=10&sort=name&order=asc&search=`
      )
    })

    it('should be able to fetch the 2nd page of the workspaces the user is a member of', async () => {
      await createMembership(memberRole.id, user2.id, workspace1.id, prisma)
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: '/workspace?page=1&limit=1'
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().items).toHaveLength(1)

      //check metadata
      const metadata = response.json().metadata
      expect(metadata.totalCount).toEqual(2)
      expect(metadata.links.self).toEqual(
        `/workspace?page=1&limit=1&sort=name&order=asc&search=`
      )
      expect(metadata.links.first).toEqual(
        `/workspace?page=0&limit=1&sort=name&order=asc&search=`
      )
      expect(metadata.links.previous).toEqual(
        `/workspace?page=0&limit=1&sort=name&order=asc&search=`
      )
      expect(metadata.links.next).toBeNull()
      expect(metadata.links.last).toEqual(
        `/workspace?page=1&limit=1&sort=name&order=asc&search=`
      )
    })
  })

  describe('Get All Workspace Invitations Tests', () => {
    it('should be able to fetch all the non accepted invitations of the user', async () => {
      //invite user2 to workspace1
      await createMembership(memberRole.id, user2.id, workspace1.id, prisma)

      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace/invitations`
      })

      const body = response.json()

      expect(body.items).toHaveLength(1)
      expect(body.items[0].workspace.slug).not.toBe(workspace2.slug)
      expect(body.items[0]).toEqual({
        invitedOn: expect.any(String),
        workspace: {
          icon: workspace1.icon,
          id: workspace1.id,
          name: workspace1.name,
          slug: workspace1.slug
        },
        roles: [
          {
            role: {
              name: memberRole.name,
              colorCode: memberRole.colorCode
            }
          }
        ]
      })
      expect(body.metadata.totalCount).toBe(1)
      expect(body.metadata.links.self).toEqual(
        `/workspace/invitations?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(body.metadata.links.first).toEqual(
        `/workspace/invitations?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(body.metadata.links.previous).toBeNull()
      expect(body.metadata.links.next).toBeNull()
      expect(body.metadata.links.last).toEqual(
        `/workspace/invitations?page=0&limit=10&sort=name&order=asc&search=`
      )
    })

    it('should be able to fetch empty list of workspace invitations for the user once all invitations are accepted', async () => {
      //invite user2 to workspace1
      await createMembership(memberRole.id, user2.id, workspace1.id, prisma)

      // accept the invitation for user2 to workspace1
      await workspaceMembershipService.acceptInvitation(user2, workspace1.slug)

      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace/invitations`
      })

      const body = response.json()
      expect(body.items).toHaveLength(0)
      expect(body.metadata).toEqual({})
    })

    it('should be able to fetch empty list of workspace invitations for the user if ownership is transferred', async () => {
      //create a new workspace for user 1
      const workspace3 = await workspaceService.createWorkspace(user1, {
        name: 'Workspace 3'
      })

      //invite user2 to workspace3
      await createMembership(memberRole.id, user2.id, workspace3.id, prisma)

      //accept the invitation for user2 to workspace3
      await workspaceMembershipService.acceptInvitation(user2, workspace3.slug)

      //transfer ownership of workspace1 to user2
      await workspaceMembershipService.transferOwnership(
        user1,
        workspace3.slug,
        user2.email
      )

      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace/invitations`
      })

      const body = response.json()
      expect(body.items).toHaveLength(0)
      expect(body.metadata).toEqual({})
    })
  })

  describe('Export Data Tests', () => {
    it('should not be able to export data of a non-existing workspace', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace/abc/export-data`
      })

      expect(response.statusCode).toBe(404)
      expect(response.json()).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: `Workspace abc not found`
      })
    })

    it('should not be able to export data of a workspace it is not a member of', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace/${workspace1.slug}/export-data`
      })

      expect(response.statusCode).toBe(401)
    })

    it('should be able to export data of the workspace', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace/${workspace1.slug}/export-data`
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()

      expect(body.name).toEqual(workspace1.name)
      expect(body.icon).toEqual(workspace1.icon)
      expect(body.workspaceRoles).toBeInstanceOf(Array)
      expect(body.projects).toBeInstanceOf(Array)

      const exampleWorkspaceRole = body.workspaceRoles[0]
      expect(exampleWorkspaceRole).toHaveProperty('name')
      expect(exampleWorkspaceRole).toHaveProperty('description')
      expect(exampleWorkspaceRole).toHaveProperty('hasAdminAuthority')
      expect(exampleWorkspaceRole).toHaveProperty('authorities')
      expect(exampleWorkspaceRole).toHaveProperty('colorCode')
    })
  })

  describe('Delete Workspace Tests', () => {
    it('should be able to delete the workspace', async () => {
      const newWorkspace = await workspaceService.createWorkspace(user1, {
        name: 'Workspace 2',
        icon: '🤓'
      })

      const response = await app.inject({
        method: 'DELETE',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace/${newWorkspace.slug}`
      })

      expect(response.statusCode).toBe(200)
    })

    it('should not be able to delete a non existing workspace', async () => {
      const response = await app.inject({
        method: 'DELETE',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace/123`
      })

      expect(response.statusCode).toBe(404)
      expect(response.json()).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: `Workspace 123 not found`
      })
    })

    it('should not be able to delete the default workspace', async () => {
      // Try deleting the default workspace
      const response = await app.inject({
        method: 'DELETE',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace/${workspace1.slug}`
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: `You cannot delete the default workspace ${workspace1.name} (${workspace1.slug})`
      })
    })
  })

  describe('Global Search Tests', () => {
    beforeEach(async () => {
      // Assign member role to user 2
      await createMembership(memberRole.id, user2.id, workspace1.id, prisma)

      // Create projects
      const project1Response = await projectService.createProject(
        user1,
        workspace1.slug,
        {
          name: 'Project 1',
          description: 'Project 1 description',
          environments: [
            {
              name: 'Dev'
            }
          ]
        }
      )
      const project2Response = await projectService.createProject(
        user1,
        workspace1.slug,
        {
          name: 'Project 2',
          description: 'Project 2 description',
          environments: [
            {
              name: 'Dev'
            }
          ]
        }
      )
      const project3Response = await projectService.createProject(
        user1,
        workspace1.slug,
        {
          name: 'Project 3',
          description: 'Project 3 description',
          accessLevel: ProjectAccessLevel.GLOBAL,
          environments: [
            {
              name: 'Dev'
            }
          ]
        }
      )

      // Update member role to include project 2
      await workspaceRoleService.updateWorkspaceRole(user1, memberRole.slug, {
        authorities: [
          Authority.READ_ENVIRONMENT,
          Authority.READ_PROJECT,
          Authority.READ_SECRET,
          Authority.READ_VARIABLE,
          Authority.READ_WORKSPACE
        ],
        projectSlugs: [project2Response.slug]
      })

      const project1DevEnv = await prisma.environment.findUnique({
        where: {
          projectId_name: {
            projectId: project1Response.id,
            name: 'Dev'
          }
        }
      })
      const project2DevEnv = await prisma.environment.findUnique({
        where: {
          projectId_name: {
            projectId: project2Response.id,
            name: 'Dev'
          }
        }
      })
      const project3DevEnv = await prisma.environment.findUnique({
        where: {
          projectId_name: {
            projectId: project3Response.id,
            name: 'Dev'
          }
        }
      })

      // Create secrets
      await secretService.createSecret(
        user1,
        {
          name: 'API_KEY',
          entries: [
            {
              environmentSlug: project1DevEnv.slug,
              value: 'test'
            }
          ]
        },
        project1Response.slug
      )

      await secretService.createSecret(
        user1,
        {
          name: 'API_TOKEN',
          entries: [
            {
              environmentSlug: project3DevEnv.slug,
              value: 'test'
            }
          ]
        },
        project3Response.slug
      )

      // Create variables
      await variableService.createVariable(
        user1,
        {
          name: 'PORT',
          entries: [
            {
              environmentSlug: project1DevEnv.slug,
              value: '3000'
            }
          ]
        },
        project1Response.slug
      )

      await variableService.createVariable(
        user1,
        {
          name: 'PORT_NUMBER',
          entries: [
            {
              environmentSlug: project2DevEnv.slug,
              value: '4000'
            }
          ]
        },
        project2Response.slug
      )
    })

    it('should be able to search for projects', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace/${workspace1.slug}/global-search/project`
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().projects).toHaveLength(3)
    })

    it('should be able to search for secrets', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace/${workspace1.slug}/global-search/api`
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().secrets).toHaveLength(2)
    })

    it('should be able to search for variables', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace/${workspace1.slug}/global-search/port`
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().variables).toHaveLength(2)
    })

    it('should be able to search for environments', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace/${workspace1.slug}/global-search/dev`
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().environments).toHaveLength(3)
    })

    it('should restrict search to projects the user has access to', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace/${workspace1.slug}/global-search/project`
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().projects).toHaveLength(2)
    })

    it('should restrict search to secrets the user has access to', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace/${workspace1.slug}/global-search/api`
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().secrets).toHaveLength(1)
    })

    it('should restrict search to variables the user has access to', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace/${workspace1.slug}/global-search/port`
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().variables).toHaveLength(1)
    })

    it('should restrict search to environments the user has access to', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace/${workspace1.slug}/global-search/dev`
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().environments).toHaveLength(2)
    })
  })
})
