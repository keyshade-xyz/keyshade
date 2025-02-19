import { AppModule } from '@/app/app.module'
import { fetchEvents } from '@/common/event'
import { QueryTransformPipe } from '@/common/pipes/query.transform.pipe'
import { EnvironmentModule } from '@/environment/environment.module'
import { EnvironmentService } from '@/environment/service/environment.service'
import { EventModule } from '@/event/event.module'
import { EventService } from '@/event/service/event.service'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
import { PrismaService } from '@/prisma/prisma.service'
import { ProjectModule } from '@/project/project.module'
import { ProjectService } from '@/project/service/project.service'
import { SecretModule } from '@/secret/secret.module'
import { SecretService } from '@/secret/service/secret.service'
import { UserService } from '@/user/service/user.service'
import { UserModule } from '@/user/user.module'
import { VariableService } from '@/variable/service/variable.service'
import { VariableModule } from '@/variable/variable.module'
import { WorkspaceRoleService } from '@/workspace-role/service/workspace-role.service'
import { WorkspaceRoleModule } from '@/workspace-role/workspace-role.module'
import { WorkspaceService } from '@/workspace/service/workspace.service'
import { WorkspaceModule } from '@/workspace/workspace.module'
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import {
  Authority,
  AuthProvider,
  EventSeverity,
  EventSource,
  EventTriggerer,
  EventType,
  Workspace,
  WorkspaceRole
} from '@prisma/client'
import { WorkspaceMembershipService } from './service/workspace-membership.service'
import { WorkspaceMembershipModule } from './workspace-membership.module'
import { AuthenticatedUser } from '@/user/user.types'

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

describe('Workspace Membership Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let eventService: EventService
  let userService: UserService
  let workspaceService: WorkspaceService
  let workspaceMembershipService: WorkspaceMembershipService
  let projectService: ProjectService
  let environmentService: EnvironmentService
  let secretService: SecretService
  let variableService: VariableService
  let workspaceRoleService: WorkspaceRoleService

  let user1: AuthenticatedUser,
    user2: AuthenticatedUser,
    user3: AuthenticatedUser
  let workspace1: Workspace
  let adminRole: WorkspaceRole, memberRole: WorkspaceRole

  const USER_IP_ADDRESS = '127.0.0.1'

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        WorkspaceMembershipModule,
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
    workspaceMembershipService = moduleRef.get(WorkspaceMembershipService)
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

    delete createUser1.defaultWorkspace
    delete createUser2.defaultWorkspace
    delete createUser3.defaultWorkspace

    user1 = { ...createUser1, ipAddress: USER_IP_ADDRESS }
    user2 = { ...createUser2, ipAddress: USER_IP_ADDRESS }
    user3 = { ...createUser3, ipAddress: USER_IP_ADDRESS }

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
    expect(workspaceMembershipService).toBeDefined()
    expect(workspaceService).toBeDefined()
    expect(projectService).toBeDefined()
    expect(environmentService).toBeDefined()
    expect(secretService).toBeDefined()
    expect(variableService).toBeDefined()
    expect(workspaceRoleService).toBeDefined()
  })

  describe('Change Ownership Tests', () => {
    it('should prevent external user from changing ownership of workspace', async () => {
      const response = await app.inject({
        method: 'PUT',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace-membership/${workspace1.slug}/transfer-ownership/${user1.id}`
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to transfer the ownership to self', async () => {
      const response = await app.inject({
        method: 'PUT',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace-membership/${workspace1.slug}/transfer-ownership/${user1.email}`
      })

      expect(response.statusCode).toBe(400)
    })

    it('should not be able to transfer ownership to a non member', async () => {
      const newWorkspace = await workspaceService.createWorkspace(user1, {
        name: 'Workspace 2',
        icon: '🤓'
      })

      const response = await app.inject({
        method: 'PUT',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace-membership/${newWorkspace.slug}/transfer-ownership/${user3.email}`
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not be able to transfer ownership to a member who did not accept the invitation', async () => {
      const newWorkspace = await workspaceService.createWorkspace(user1, {
        name: 'Workspace 2',
        icon: '🤓'
      })

      // Create membership
      await createMembership(memberRole.id, user3.id, newWorkspace.id, prisma)

      const response = await app.inject({
        method: 'PUT',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace-membership/${newWorkspace.slug}/transfer-ownership/${user3.email}`
      })

      expect(response.statusCode).toBe(400)
    })

    it('should be able to transfer the ownership of the workspace', async () => {
      const newWorkspace = await workspaceService.createWorkspace(user1, {
        name: 'Workspace 2',
        icon: '🤓'
      })

      // Create membership
      await createMembership(memberRole.id, user2.id, newWorkspace.id, prisma)

      // Set the membership accepted status to true
      await prisma.workspaceMember.update({
        where: {
          workspaceId_userId: {
            userId: user2.id,
            workspaceId: newWorkspace.id
          }
        },
        data: {
          invitationAccepted: true
        }
      })

      const response = await app.inject({
        method: 'PUT',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace-membership/${newWorkspace.slug}/transfer-ownership/${user2.email}`
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
        icon: '🤓'
      })

      // Create membership
      await createMembership(memberRole.id, user2.id, newWorkspace.id, prisma)

      const response = await app.inject({
        method: 'PUT',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace-membership/${newWorkspace.slug}/transfer-ownership/${user3.email}`
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to transfer ownership of default workspace', async () => {
      // Invite another user to the workspace
      await workspaceMembershipService.inviteUsersToWorkspace(
        user1,
        workspace1.slug,
        [
          {
            email: user2.email,
            roleSlugs: [memberRole.slug]
          }
        ]
      )

      // Accept the invitation
      await workspaceMembershipService.acceptInvitation(user2, workspace1.slug)

      // Try transferring ownership
      const response = await app.inject({
        method: 'PUT',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace-membership/${workspace1.slug}/transfer-ownership/${user2.email}`
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('Invite User Tests', () => {
    it('should do nothing if null or empty array is sent for invitation of user', async () => {
      const response = await app.inject({
        method: 'POST',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace-membership/${workspace1.slug}/invite-users`,
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
        url: `/workspace-membership/${workspace1.slug}/invite-users`,
        payload: [
          {
            email: user2.email,
            roleSlugs: [adminRole.slug]
          }
        ]
      })

      expect(response.statusCode).toBe(400)
    })

    it('should allow user to invite another user to the workspace', async () => {
      const response = await app.inject({
        method: 'POST',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace-membership/${workspace1.slug}/invite-users`,
        payload: [
          {
            email: user2.email,
            roleSlugs: [memberRole.slug]
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
        invitationAccepted: false,
        createdOn: expect.any(Date)
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
        url: `/workspace-membership/${workspace1.slug}/invite-users`,
        payload: [
          {
            email: user2.email,
            roleSlugs: []
          }
        ]
      })

      expect(response.statusCode).toBe(409)
    })

    it('should have created a INVITED_TO_WORKSPACE event', async () => {
      // Invite user2 to workspace1
      await workspaceMembershipService.inviteUsersToWorkspace(
        user1,
        workspace1.slug,
        [
          {
            email: user2.email,
            roleSlugs: []
          }
        ]
      )

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
      expect(event.type).toBe(EventType.INVITED_TO_WORKSPACE)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBeDefined()
    })

    it('should have created a new user if they did not exist while inviting them to the workspace', async () => {
      const response = await app.inject({
        method: 'POST',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace-membership/${workspace1.slug}/invite-users`,
        payload: [
          {
            email: 'joy@keyshade.xyz',
            roleSlugs: [memberRole.slug]
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
      expect(user.email).toBe('joy@keyshade.xyz')
      expect(user.authProvider).toBe(AuthProvider.EMAIL_OTP)
    })
  })

  describe('Remove Users Tests', () => {
    it('should be able to remove users from workspace', async () => {
      const response = await app.inject({
        method: 'DELETE',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace-membership/${workspace1.slug}/remove-users`,
        query: {
          userEmails: user2.email
        }
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
        url: `/workspace-membership/${workspace1.slug}/remove-users`,
        query: {
          userEmails: user1.email
        }
      })

      expect(response.statusCode).toBe(400)
    })

    it('should have created a REMOVED_FROM_WORKSPACE event', async () => {
      // Create membership
      await createMembership(adminRole.id, user2.id, workspace1.id, prisma)

      // Remove user2 from workspace1
      await workspaceMembershipService.removeUsersFromWorkspace(
        user1,
        workspace1.slug,
        [user2.email]
      )

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
      expect(event.type).toBe(EventType.REMOVED_FROM_WORKSPACE)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBeDefined()
    })
  })

  describe('Update Membership Tests', () => {
    it('should not be able to update the membership to admin role', async () => {
      // Create membership
      await createMembership(memberRole.id, user2.id, workspace1.id, prisma)

      const response = await app.inject({
        method: 'PUT',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace-membership/${workspace1.slug}/update-member-role/${user2.email}`,
        payload: [adminRole.slug]
      })

      expect(response.statusCode).toBe(400)
    })

    it('should be able to update the role of a member', async () => {
      await createMembership(adminRole.id, user2.id, workspace1.id, prisma)

      const response = await app.inject({
        method: 'PUT',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace-membership/${workspace1.slug}/update-member-role/${user2.email}`,
        payload: [memberRole.slug]
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
      await workspaceMembershipService.updateMemberRoles(
        user1,
        workspace1.slug,
        user2.email,
        [memberRole.slug]
      )

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
      expect(event.type).toBe(EventType.WORKSPACE_MEMBERSHIP_UPDATED)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBeDefined()
    })

    it('should not be able to update the role of a non existing member', async () => {
      const response = await app.inject({
        method: 'PUT',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace-membership/${workspace1.slug}/update-member-role/${user2.email}`,
        payload: []
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('Cancel Invitation Tests', () => {
    it('should be able to cancel the invitation', async () => {
      // Invite user2 to workspace1
      await workspaceMembershipService.inviteUsersToWorkspace(
        user1,
        workspace1.slug,
        [
          {
            email: user2.email,
            roleSlugs: []
          }
        ]
      )

      const response = await app.inject({
        method: 'DELETE',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace-membership/${workspace1.slug}/cancel-invitation/${user2.email}`
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
        url: `/workspace-membership/${workspace1.slug}/cancel-invitation/${user2.email}`
      })

      expect(response.statusCode).toBe(400)
    })

    it('should have created a CANCELLED_INVITATION event', async () => {
      // Invite user2 to workspace1
      await workspaceMembershipService.inviteUsersToWorkspace(
        user1,
        workspace1.slug,
        [
          {
            email: user2.email,
            roleSlugs: []
          }
        ]
      )

      // Cancel the invitation
      await workspaceMembershipService.cancelInvitation(
        user1,
        workspace1.slug,
        user2.email
      )

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
      expect(event.type).toBe(EventType.CANCELLED_INVITATION)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBeDefined()
    })
  })

  describe('Decline Invitation Tests', () => {
    it('should be able to decline invitation to the workspace', async () => {
      // Send an invitation
      await workspaceMembershipService.inviteUsersToWorkspace(
        user1,
        workspace1.slug,
        [
          {
            email: user2.email,
            roleSlugs: [memberRole.slug]
          }
        ]
      )

      const response = await app.inject({
        method: 'DELETE',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace-membership/${workspace1.slug}/decline-invitation`
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
        url: `/workspace-membership/${workspace1.slug}/decline-invitation`
      })

      expect(response.statusCode).toBe(400)
    })

    it('should have created a DECLINED_INVITATION event', async () => {
      // Invite user2 to workspace1
      await workspaceMembershipService.inviteUsersToWorkspace(
        user1,
        workspace1.slug,
        [
          {
            email: user2.email,
            roleSlugs: [memberRole.slug]
          }
        ]
      )

      // Decline the invitation
      await workspaceMembershipService.declineInvitation(user2, workspace1.slug)

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
      expect(event.type).toBe(EventType.DECLINED_INVITATION)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBeDefined()
    })
  })

  describe('Accept Invitation Tests', () => {
    it('should be able to accept the invitation to the workspace', async () => {
      await createMembership(adminRole.id, user2.id, workspace1.id, prisma)

      const response = await app.inject({
        method: 'POST',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace-membership/${workspace1.slug}/accept-invitation`
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
        invitationAccepted: true,
        createdOn: expect.any(Date)
      })
    })

    it('should not be able to accept the invitation if the user is not invited', async () => {
      const response = await app.inject({
        method: 'POST',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace-membership/${workspace1.slug}/accept-invitation`
      })

      expect(response.statusCode).toBe(400)
    })

    it('should have created a ACCEPT_INVITATION event', async () => {
      // Invite user2 to workspace1
      await workspaceMembershipService.inviteUsersToWorkspace(
        user1,
        workspace1.slug,
        [
          {
            email: user2.email,
            roleSlugs: [memberRole.slug]
          }
        ]
      )

      // Accept the invitation
      await workspaceMembershipService.acceptInvitation(user2, workspace1.slug)

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
      expect(event.type).toBe(EventType.ACCEPTED_INVITATION)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBeDefined()
    })
  })

  describe('Leave Workspace Tests', () => {
    it('should be able to leave the workspace', async () => {
      // Create membership
      await createMembership(memberRole.id, user2.id, workspace1.id, prisma)

      const response = await app.inject({
        method: 'DELETE',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace-membership/${workspace1.slug}/leave`
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
        url: `/workspace-membership/${workspace1.slug}/leave`
      })

      expect(response.statusCode).toBe(400)
    })

    it('should not be able to leave the workspace if the user is not a member', async () => {
      const response = await app.inject({
        method: 'DELETE',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace-membership/${workspace1.slug}/leave`
      })

      expect(response.statusCode).toBe(401)
    })

    it('should have created a LEFT_WORKSPACE event', async () => {
      // Create membership
      await createMembership(memberRole.id, user2.id, workspace1.id, prisma)

      // Leave the workspace
      await workspaceMembershipService.leaveWorkspace(user2, workspace1.slug)

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
      expect(event.type).toBe(EventType.LEFT_WORKSPACE)
      expect(event.workspaceId).toBe(workspace1.id)
      expect(event.itemId).toBeDefined()
    })
  })

  describe('Check Membership Tests', () => {
    it('should be able to check if user is a member of the workspace', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace-membership/${workspace1.slug}/is-member/${user2.email}`
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
        url: `/workspace-membership/${workspace1.slug}/is-member/${user1.email}`
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Get All Members Tests', () => {
    it('should be able to get all the members of the workspace', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user1.email
        },
        url: `/workspace-membership/${workspace1.slug}/members`
      })

      expect(response.statusCode).toBe(200)

      const workspaceMembers = response.json().items

      expect(workspaceMembers).toBeInstanceOf(Array)
      expect(workspaceMembers).toHaveLength(1)

      const workspaceMember = workspaceMembers[0]

      expect(workspaceMember.id).toBeDefined()
      expect(workspaceMember.user).toBeDefined()
      expect(workspaceMember.roles).toBeDefined()
      expect(workspaceMember.invitationAccepted).toBeDefined()

      //check metadata
      const metadata = response.json().metadata
      expect(metadata.totalCount).toEqual(1)
      expect(metadata.links.self).toEqual(
        `/workspace-membership/${workspace1.slug}/members?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.first).toEqual(
        `/workspace-membership/${workspace1.slug}/members?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.previous).toBeNull()
      expect(metadata.links.next).toBeNull()
      expect(metadata.links.last).toEqual(
        `/workspace-membership/${workspace1.slug}/members?page=0&limit=10&sort=name&order=asc&search=`
      )
    })

    it('should not be able to get all the members of the workspace if user is not a member', async () => {
      const response = await app.inject({
        method: 'GET',
        headers: {
          'x-e2e-user-email': user2.email
        },
        url: `/workspace-membership/${workspace1.slug}/members`
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
