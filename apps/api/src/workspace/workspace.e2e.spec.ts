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
import fetchEvents from '@/common/fetch-events'
import { EventService } from '@/event/service/event.service'
import { EventModule } from '@/event/event.module'
import { UserModule } from '@/user/user.module'
import { UserService } from '@/user/service/user.service'
import { WorkspaceService } from './service/workspace.service'
import { QueryTransformPipe } from '@/common/query.transform.pipe'
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

  let user1: User, user2: User, user3: User
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
        WorkspaceRoleModule
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
    user3 = createUser3

    memberRole = await prisma.workspaceRole.create({
      data: {
        name: 'Member',
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
  })

  it('should be able to create a new workspace', async () => {
    const response = await app.inject({
      method: 'POST',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: '/workspace',
      payload: {
        name: 'Workspace 1',
        description: 'Workspace 1 description'
      }
    })

    expect(response.statusCode).toBe(201)
    workspace1 = response.json()

    expect(workspace1.name).toBe('Workspace 1')
    expect(workspace1.description).toBe('Workspace 1 description')
    expect(workspace1.ownerId).toBe(user1.id)
    expect(workspace1.isFreeTier).toBe(true)
    expect(workspace1.isDefault).toBe(false)
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
        description: 'My Workspace description'
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
      description: 'Workspace 1 description'
    })

    const response = await app.inject({
      method: 'POST',
      headers: {
        'x-e2e-user-email': user2.email
      },
      url: '/workspace',
      payload: {
        name: 'Workspace 1',
        description: 'Workspace 1 description'
      }
    })

    expect(response.statusCode).toBe(201)
    workspace2 = response.json()

    expect(workspace2.name).toBe('Workspace 1')
    expect(workspace2.description).toBe('Workspace 1 description')
    expect(workspace2.ownerId).toBe(user2.id)
    expect(workspace2.isFreeTier).toBe(true)
    expect(workspace2.isDefault).toBe(false)
  })

  it('should have created a WORKSPACE_CREATED event', async () => {
    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
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
      invitationAccepted: true
    })
  })

  it('should be able to update the workspace', async () => {
    const response = await app.inject({
      method: 'PUT',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}`,
      payload: {
        name: 'Workspace 1 Updated',
        description: 'Workspace 1 updated description'
      }
    })

    expect(response.statusCode).toBe(200)
    workspace1 = response.json()

    expect(workspace1.name).toBe('Workspace 1 Updated')
    expect(workspace1.description).toBe('Workspace 1 updated description')
  })

  it('should not be able to change the name to an existing workspace or same name', async () => {
    const response = await app.inject({
      method: 'PUT',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}`,
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
      url: `/workspace/${workspace1.id}`,
      payload: {
        name: 'Workspace 1 Updated',
        description: 'Workspace 1 updated description'
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should have created a WORKSPACE_UPDATED event', async () => {
    await workspaceService.updateWorkspace(user1, workspace1.id, {
      name: 'Workspace 1'
    })

    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
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

  it('should do nothing if null or empty array is sent for invitation of user', async () => {
    const response = await app.inject({
      method: 'POST',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/invite-users`,
      payload: []
    })

    expect(response.statusCode).toBe(201)
  })

  it('should not allow user to invite another user ', async () => {
    const response = await app.inject({
      method: 'POST',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/invite-users`,
      payload: [
        {
          email: user2.email,
          roleIds: [adminRole.id]
        }
      ]
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: `Admin role cannot be assigned to the user`
    })
  })

  it('should allow user to invite another user to the workspace', async () => {
    const response = await app.inject({
      method: 'POST',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/invite-users`,
      payload: [
        {
          email: user2.email,
          roleIds: [memberRole.id]
        }
      ]
    })

    expect(response.statusCode).toBe(201)

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace1.id,
          userId: user2.id
        }
      }
    })

    expect(membership).toBeDefined()
    expect(membership).toEqual({
      id: expect.any(String),
      userId: user2.id,
      workspaceId: workspace1.id,
      invitationAccepted: false
    })
  })

  it('should not be able to update the membership to admin role', async () => {
    // Create membership
    await createMembership(memberRole.id, user2.id, workspace1.id, prisma)

    const response = await app.inject({
      method: 'PUT',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/update-member-role/${user2.id}`,
      payload: [adminRole.id]
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: `Admin role cannot be assigned to the user`
    })
  })

  it('should not be able to add an existing user to the workspace', async () => {
    // Add user2 to workspace1
    await createMembership(memberRole.id, user2.id, workspace1.id, prisma)

    const response = await app.inject({
      method: 'POST',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/invite-users`,
      payload: [
        {
          email: user2.email,
          roleIds: []
        }
      ]
    })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({
      statusCode: 409,
      error: 'Conflict',
      message: `User ${user2.name} (${user2.id}) is already a member of workspace ${workspace1.name} (${workspace1.id})`
    })
  })

  it('should have created a INVITED_TO_WORKSPACE event', async () => {
    // Invite user2 to workspace1
    await workspaceService.inviteUsersToWorkspace(user1, workspace1.id, [
      {
        email: user2.email,
        roleIds: []
      }
    ])

    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.WORKSPACE
    )

    const event = response.items[0]

    expect(event).toBeDefined()
    expect(event.source).toBe(EventSource.WORKSPACE)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.INVITED_TO_WORKSPACE)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBeDefined()
  })

  it('should be able to cancel the invitation', async () => {
    // Invite user2 to workspace1
    await workspaceService.inviteUsersToWorkspace(user1, workspace1.id, [
      {
        email: user2.email,
        roleIds: []
      }
    ])

    const response = await app.inject({
      method: 'DELETE',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/cancel-invitation/${user2.id}`
    })

    expect(response.statusCode).toBe(200)

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace1.id,
          userId: user2.id
        }
      }
    })

    expect(membership).toBeNull()
  })

  it('should not be able to cancel the invitation if the user is not invited', async () => {
    const response = await app.inject({
      method: 'DELETE',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/cancel-invitation/${user2.id}`
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: `User ${user2.id} is not invited to workspace ${workspace1.id}`
    })
  })

  it('should have created a CANCELLED_INVITATION event', async () => {
    // Invite user2 to workspace1
    await workspaceService.inviteUsersToWorkspace(user1, workspace1.id, [
      {
        email: user2.email,
        roleIds: []
      }
    ])

    // Cancel the invitation
    await workspaceService.cancelInvitation(user1, workspace1.id, user2.id)

    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.WORKSPACE
    )

    const event = response.items[0]

    expect(event).toBeDefined()
    expect(event.source).toBe(EventSource.WORKSPACE)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.CANCELLED_INVITATION)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBeDefined()
  })

  it('should be able to decline invitation to the workspace', async () => {
    // Send an invitation
    await workspaceService.inviteUsersToWorkspace(user1, workspace1.id, [
      {
        email: user2.email,
        roleIds: [memberRole.id]
      }
    ])

    const response = await app.inject({
      method: 'DELETE',
      headers: {
        'x-e2e-user-email': user2.email
      },
      url: `/workspace/${workspace1.id}/decline-invitation`
    })

    expect(response.statusCode).toBe(200)

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace1.id,
          userId: user2.id
        }
      }
    })

    expect(membership).toBeNull()
  })

  it('should not be able to decline the invitation if the user is not invited', async () => {
    const response = await app.inject({
      method: 'DELETE',
      headers: {
        'x-e2e-user-email': user2.email
      },
      url: `/workspace/${workspace1.id}/decline-invitation`
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: `User ${user2.id} is not invited to workspace ${workspace1.id}`
    })
  })

  it('should have created a DECLINED_INVITATION event', async () => {
    // Invite user2 to workspace1
    await workspaceService.inviteUsersToWorkspace(user1, workspace1.id, [
      {
        email: user2.email,
        roleIds: [memberRole.id]
      }
    ])

    // Decline the invitation
    await workspaceService.declineInvitation(user2, workspace1.id)

    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.WORKSPACE
    )

    const event = response.items[0]

    expect(event).toBeDefined()
    expect(event.source).toBe(EventSource.WORKSPACE)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.DECLINED_INVITATION)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBeDefined()
  })

  it('should be able to accept the invitation to the workspace', async () => {
    await createMembership(adminRole.id, user2.id, workspace1.id, prisma)

    const response = await app.inject({
      method: 'POST',
      headers: {
        'x-e2e-user-email': user2.email
      },
      url: `/workspace/${workspace1.id}/accept-invitation`
    })

    expect(response.statusCode).toBe(201)

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace1.id,
          userId: user2.id
        }
      }
    })

    expect(membership).toBeDefined()
    expect(membership).toEqual({
      id: expect.any(String),
      userId: user2.id,
      workspaceId: workspace1.id,
      invitationAccepted: true
    })
  })

  it('should not be able to accept the invitation if the user is not invited', async () => {
    const response = await app.inject({
      method: 'POST',
      headers: {
        'x-e2e-user-email': user2.email
      },
      url: `/workspace/${workspace1.id}/accept-invitation`
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: `User ${user2.id} is not invited to workspace ${workspace1.id}`
    })
  })

  it('should have created a ACCEPT_INVITATION event', async () => {
    // Invite user2 to workspace1
    await workspaceService.inviteUsersToWorkspace(user1, workspace1.id, [
      {
        email: user2.email,
        roleIds: [memberRole.id]
      }
    ])

    // Accept the invitation
    await workspaceService.acceptInvitation(user2, workspace1.id)

    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.WORKSPACE
    )

    const event = response.items[0]

    expect(event).toBeDefined()
    expect(event.source).toBe(EventSource.WORKSPACE)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.ACCEPTED_INVITATION)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBeDefined()
  })

  it('should have created a new user if they did not exist while inviting them to the workspace', async () => {
    const response = await app.inject({
      method: 'POST',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/invite-users`,
      payload: [
        {
          email: 'joy@keyshade.xyz',
          roleIds: [memberRole.id]
        }
      ]
    })

    expect(response.statusCode).toBe(201)

    // Expect the user to have been created
    const user = await prisma.user.findUnique({
      where: {
        email: 'joy@keyshade.xyz'
      }
    })

    expect(user).toBeDefined()
  })

  it('should be able to leave the workspace', async () => {
    // Create membership
    await createMembership(memberRole.id, user2.id, workspace1.id, prisma)

    const response = await app.inject({
      method: 'DELETE',
      headers: {
        'x-e2e-user-email': user2.email
      },
      url: `/workspace/${workspace1.id}/leave`
    })

    expect(response.statusCode).toBe(200)

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace1.id,
          userId: user2.id
        }
      }
    })

    expect(membership).toBeNull()
  })

  it('should not be able to leave the workspace if user is workspace owner', async () => {
    const response = await app.inject({
      method: 'DELETE',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/leave`
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: `You cannot leave the workspace as you are the owner of the workspace. Please transfer the ownership to another member before leaving the workspace.`
    })
  })

  it('should not be able to leave the workspace if the user is not a member', async () => {
    const response = await app.inject({
      method: 'DELETE',
      headers: {
        'x-e2e-user-email': user2.email
      },
      url: `/workspace/${workspace1.id}/leave`
    })

    expect(response.statusCode).toBe(401)
  })

  it('should have created a LEFT_WORKSPACE event', async () => {
    // Create membership
    await createMembership(memberRole.id, user2.id, workspace1.id, prisma)

    // Leave the workspace
    await workspaceService.leaveWorkspace(user2, workspace1.id)

    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.WORKSPACE
    )

    const event = response.items[0]

    expect(event).toBeDefined()
    expect(event.source).toBe(EventSource.WORKSPACE)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.LEFT_WORKSPACE)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBeDefined()
  })

  it('should be able to update the role of a member', async () => {
    await createMembership(adminRole.id, user2.id, workspace1.id, prisma)

    const response = await app.inject({
      method: 'PUT',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/update-member-role/${user2.id}`,
      payload: [memberRole.id]
    })

    expect(response.statusCode).toBe(200)

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace1.id,
          userId: user2.id
        }
      },
      select: {
        roles: {
          select: {
            roleId: true
          }
        }
      }
    })

    expect(membership.roles).toEqual([
      {
        roleId: memberRole.id
      }
    ])
  })

  it('should have created a WORKSPACE_MEMBERSHIP_UPDATED event', async () => {
    // Create membership
    await createMembership(adminRole.id, user2.id, workspace1.id, prisma)

    // Update the membership
    await workspaceService.updateMemberRoles(user1, workspace1.id, user2.id, [
      memberRole.id
    ])

    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.WORKSPACE
    )

    const event = response.items[0]

    expect(event).toBeDefined()
    expect(event.source).toBe(EventSource.WORKSPACE)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.WORKSPACE_MEMBERSHIP_UPDATED)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBeDefined()
  })

  it('should be able to remove users from workspace', async () => {
    const response = await app.inject({
      method: 'DELETE',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/remove-users`,
      payload: [user2.id]
    })

    expect(response.statusCode).toBe(200)

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace1.id,
          userId: user2.id
        }
      }
    })

    expect(membership).toBeNull()
  })

  it('should not be able to remove self from workspace', async () => {
    const response = await app.inject({
      method: 'DELETE',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/remove-users`,
      payload: [user1.id]
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: `You cannot remove yourself from the workspace. Please transfer the ownership to another member before leaving the workspace.`
    })
  })

  it('should have created a REMOVED_FROM_WORKSPACE event', async () => {
    // Create membership
    await createMembership(adminRole.id, user2.id, workspace1.id, prisma)

    // Remove user2 from workspace1
    await workspaceService.removeUsersFromWorkspace(user1, workspace1.id, [
      user2.id
    ])

    const response = await fetchEvents(
      eventService,
      user1,
      workspace1.id,
      EventSource.WORKSPACE
    )

    const event = response.items[0]

    expect(event).toBeDefined()
    expect(event.source).toBe(EventSource.WORKSPACE)
    expect(event.triggerer).toBe(EventTriggerer.USER)
    expect(event.severity).toBe(EventSeverity.INFO)
    expect(event.type).toBe(EventType.REMOVED_FROM_WORKSPACE)
    expect(event.workspaceId).toBe(workspace1.id)
    expect(event.itemId).toBeDefined()
  })

  it('should not be able to update the role of a non existing member', async () => {
    const response = await app.inject({
      method: 'PUT',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/update-member-role/${user2.id}`,
      payload: []
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: `User ${user2.id} is not a member of workspace ${workspace1.name} (${workspace1.id})`
    })
  })

  it('should be able to check if user is a member of the workspace', async () => {
    const response = await app.inject({
      method: 'GET',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/is-member/${user2.id}`
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(false)
  })

  it('should not be able to check if user is a member of the workspace if user is not a member', async () => {
    const response = await app.inject({
      method: 'GET',
      headers: {
        'x-e2e-user-email': user2.email
      },
      url: `/workspace/${workspace1.id}/is-member/${user1.id}`
    })

    expect(response.statusCode).toBe(401)
  })

  it('should be able to get all the members of the workspace', async () => {
    const response = await app.inject({
      method: 'GET',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/members`
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().items).toBeInstanceOf(Array)
    expect(response.json().items).toHaveLength(1)

    //check metadata
    const metadata = response.json().metadata
    expect(metadata.totalCount).toEqual(1)
    expect(metadata.links.self).toEqual(
      `/workspace/${workspace1.id}/members?page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(metadata.links.first).toEqual(
      `/workspace/${workspace1.id}/members?page=0&limit=10&sort=name&order=asc&search=`
    )
    expect(metadata.links.previous).toBeNull()
    expect(metadata.links.next).toBeNull()
    expect(metadata.links.last).toEqual(
      `/workspace/${workspace1.id}/members?page=0&limit=10&sort=name&order=asc&search=`
    )
  })

  it('should not be able to get all the members of the workspace if user is not a member', async () => {
    const response = await app.inject({
      method: 'GET',
      headers: {
        'x-e2e-user-email': user2.email
      },
      url: `/workspace/${workspace1.id}/members`
    })

    expect(response.statusCode).toBe(401)
  })

  it('should be able to fetch the workspace by id', async () => {
    const response = await app.inject({
      method: 'GET',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}`
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().name).toEqual(workspace1.name)
  })

  it('should not be able to fetch the workspace by id if user is not a member', async () => {
    const response = await app.inject({
      method: 'GET',
      headers: {
        'x-e2e-user-email': user2.email
      },
      url: `/workspace/${workspace1.id}`
    })

    expect(response.statusCode).toBe(401)
  })

  it('should prevent external user from changing ownership of workspace', async () => {
    const response = await app.inject({
      method: 'PUT',
      headers: {
        'x-e2e-user-email': user2.email
      },
      url: `/workspace/${workspace1.id}/transfer-ownership/${user1.id}`
    })

    expect(response.statusCode).toBe(401)
  })

  it('should not be able to transfer the ownership to self', async () => {
    const response = await app.inject({
      method: 'PUT',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/transfer-ownership/${user1.id}`
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: `You are already the owner of the workspace ${workspace1.name} (${workspace1.id})`
    })
  })

  it('should not be able to transfer ownership to a non member', async () => {
    const newWorkspace = await workspaceService.createWorkspace(user1, {
      name: 'Workspace 2',
      description: 'Workspace 2 description'
    })

    const response = await app.inject({
      method: 'PUT',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${newWorkspace.id}/transfer-ownership/${user3.id}`
    })

    expect(response.json()).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: `User ${user3.id} is not a member of workspace ${newWorkspace.name} (${newWorkspace.id})`
    })
  })

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

  it('should be able to transfer the ownership of the workspace', async () => {
    const newWorkspace = await workspaceService.createWorkspace(user1, {
      name: 'Workspace 2',
      description: 'Workspace 2 description'
    })

    // Create membership
    await createMembership(memberRole.id, user2.id, newWorkspace.id, prisma)

    const response = await app.inject({
      method: 'PUT',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${newWorkspace.id}/transfer-ownership/${user2.id}`
    })

    expect(response.statusCode).toBe(200)

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: newWorkspace.id
      }
    })

    expect(workspace.ownerId).toEqual(user2.id)
  })

  it('should not be able to transfer ownership if is not admin', async () => {
    const newWorkspace = await workspaceService.createWorkspace(user1, {
      name: 'Workspace 2',
      description: 'Workspace 2 description'
    })

    // Create membership
    await createMembership(memberRole.id, user2.id, newWorkspace.id, prisma)

    const response = await app.inject({
      method: 'PUT',
      headers: {
        'x-e2e-user-email': user2.email
      },
      url: `/workspace/${newWorkspace.id}/transfer-ownership/${user3.id}`
    })

    expect(response.statusCode).toBe(401)
  })

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
      message: `Workspace with id abc not found`
    })
  })

  it('should not be able to export data of a workspace it is not a member of', async () => {
    const response = await app.inject({
      method: 'GET',
      headers: {
        'x-e2e-user-email': user2.email
      },
      url: `/workspace/${workspace1.id}/export-data`
    })

    expect(response.statusCode).toBe(401)
  })

  it('should be able to export data of the workspace', async () => {
    const response = await app.inject({
      method: 'GET',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/export-data`
    })

    expect(response.statusCode).toBe(200)

    const body = response.json()

    expect(body.name).toEqual(workspace1.name)
    expect(body.description).toEqual(workspace1.description)
    expect(body.workspaceRoles).toBeInstanceOf(Array)
    expect(body.projects).toBeInstanceOf(Array)
  })

  it('should be able to delete the workspace', async () => {
    const newWorkspace = await workspaceService.createWorkspace(user1, {
      name: 'Workspace 2',
      description: 'Workspace 2 description'
    })

    const response = await app.inject({
      method: 'DELETE',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${newWorkspace.id}`
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
      message: `Workspace with id 123 not found`
    })
  })

  it('should not be able to delete the default workspace', async () => {
    // Try deleting the default workspace
    const response = await app.inject({
      method: 'DELETE',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}`
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: `You cannot delete the default workspace ${workspace1.name} (${workspace1.id})`
    })
  })

  it('should not be able to transfer ownership of default workspace', async () => {
    // Invite another user to the workspace
    await workspaceService.inviteUsersToWorkspace(user1, workspace1.id, [
      {
        email: user2.email,
        roleIds: [memberRole.id]
      }
    ])

    // Accept the invitation
    await workspaceService.acceptInvitation(user2, workspace1.id)

    // Try transferring ownership
    const response = await app.inject({
      method: 'PUT',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/transfer-ownership/${user2.id}`
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: `You cannot transfer ownership of default workspace ${workspace1.name} (${workspace1.id})`
    })
  })

  describe('Global Search Tests', () => {
    beforeEach(async () => {
      // Assign member role to user 2
      await createMembership(memberRole.id, user2.id, workspace1.id, prisma)

      // Create projects
      const project1Response = await projectService.createProject(
        user1,
        workspace1.id,
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
        workspace1.id,
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
        workspace1.id,
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
      await workspaceRoleService.updateWorkspaceRole(user1, memberRole.id, {
        authorities: [
          Authority.READ_ENVIRONMENT,
          Authority.READ_PROJECT,
          Authority.READ_SECRET,
          Authority.READ_VARIABLE,
          Authority.READ_WORKSPACE
        ],
        projectIds: [project2Response.id]
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
              environmentId: project1DevEnv.id,
              value: 'test'
            }
          ]
        },
        project1Response.id
      )

      await secretService.createSecret(
        user1,
        {
          name: 'API_TOKEN',
          entries: [
            {
              environmentId: project3DevEnv.id,
              value: 'test'
            }
          ]
        },
        project3Response.id
      )

      // Create variables
      await variableService.createVariable(
        user1,
        {
          name: 'PORT',
          entries: [
            {
              environmentId: project1DevEnv.id,
              value: '3000'
            }
          ]
        },
        project1Response.id
      )

      await variableService.createVariable(
        user1,
        {
          name: 'PORT_NUMBER',
          entries: [
            {
              environmentId: project2DevEnv.id,
              value: '4000'
            }
          ]
        },
        project2Response.id
      )
    })

    it('should be able to search for projects', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace/${workspace1.id}/global-search/project`
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
        url: `/workspace/${workspace1.id}/global-search/api`
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
        url: `/workspace/${workspace1.id}/global-search/port`
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
        url: `/workspace/${workspace1.id}/global-search/dev`
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
        url: `/workspace/${workspace1.id}/global-search/project`
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
        url: `/workspace/${workspace1.id}/global-search/api`
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
        url: `/workspace/${workspace1.id}/global-search/port`
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
        url: `/workspace/${workspace1.id}/global-search/dev`
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().environments).toHaveLength(2)
    })
  })
})
