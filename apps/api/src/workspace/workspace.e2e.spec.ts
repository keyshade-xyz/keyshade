import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { PrismaService } from '../prisma/prisma.service'
import { AppModule } from '../app/app.module'
import { WorkspaceModule } from './workspace.module'
import { Test } from '@nestjs/testing'
import { MAIL_SERVICE } from '../mail/services/interface.service'
import { MockMailService } from '../mail/services/mock.service'
import {
  Authority,
  EventSeverity,
  EventSource,
  EventTriggerer,
  EventType,
  User,
  Workspace,
  WorkspaceRole
} from '@prisma/client'
import cleanUp from '../common/cleanup'
import fetchEvents from '../common/fetch-events'

const createMembership = async (
  adminRoleId: string,
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
              id: adminRoleId
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

  let user1: User, user2: User, user3: User
  let workspace1: Workspace, workspace2: Workspace
  let adminRole: WorkspaceRole, memberRole: WorkspaceRole

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, WorkspaceModule]
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

    const createUser1 = prisma.user.create({
      data: {
        email: 'johndoe@keyshade.xyz',
        name: 'John Doe',
        isOnboardingFinished: true
      }
    })

    const createUser2 = prisma.user.create({
      data: {
        email: 'janedoe@keyshade.xyz',
        name: 'Jane Doe',
        isOnboardingFinished: true
      }
    })

    const createUser3 = prisma.user.create({
      data: {
        email: 'sadie@keyshade.xyz',
        name: 'Sadie',
        isOnboardingFinished: true
      }
    })

    const result = await prisma.$transaction([
      createUser1,
      createUser2,
      createUser3
    ])

    user1 = result[0]
    user2 = result[1]
    user3 = result[2]
  })

  it('should be defined', async () => {
    expect(app).toBeDefined()
    expect(prisma).toBeDefined()
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
    expect(response.json()).toEqual({
      id: expect.any(String),
      name: 'Workspace 1',
      description: 'Workspace 1 description',
      ownerId: user1.id,
      isFreeTier: true,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      lastUpdatedById: null
    })

    workspace1 = response.json()
  })

  it('should not be able to create a workspace with the same name', async () => {
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

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({
      statusCode: 409,
      error: 'Conflict',
      message: 'Workspace already exists'
    })
  })

  it('should let other user to create workspace with same name', async () => {
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
    expect(response.json()).toEqual({
      id: expect.any(String),
      name: 'Workspace 1',
      description: 'Workspace 1 description',
      ownerId: user2.id,
      isFreeTier: true,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      lastUpdatedById: null
    })

    workspace2 = response.json()
  })

  it('should have created a WORKSPACE_CREATED event', async () => {
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
      type: EventType.WORKSPACE_CREATED,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.arrayContaining([event]))
  })

  it('should have created a new role with name Admin', async () => {
    adminRole = await prisma.workspaceRole.findUnique({
      where: {
        workspaceId_name: {
          workspaceId: workspace1.id,
          name: 'Admin'
        }
      }
    })

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
    expect(response.json()).toEqual({
      id: workspace1.id,
      name: 'Workspace 1 Updated',
      description: 'Workspace 1 updated description',
      ownerId: user1.id,
      isFreeTier: true,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      lastUpdatedById: user1.id
    })

    workspace1 = response.json()
  })

  it('should not be able to change the name to an existing workspace or same name', async () => {
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
    expect(response.json()).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: `User ${user2.id} does not have the required authorities to perform the action`
    })
  })

  it('should have created a WORKSPACE_UPDATED event', async () => {
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
      type: EventType.WORKSPACE_UPDATED,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.arrayContaining([event]))
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

  it('should allow user to invite another user to the workspace', async () => {
    memberRole = await prisma.workspaceRole.create({
      data: {
        name: 'Member',
        workspaceId: workspace1.id,
        authorities: [Authority.READ_WORKSPACE]
      }
    })

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

  it('should not be able to add an existing user to the workspace', async () => {
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
      type: EventType.INVITED_TO_WORKSPACE,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.arrayContaining([event]))
  })

  it('should be able to cancel the invitation', async () => {
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
      type: EventType.CANCELLED_INVITATION,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.arrayContaining([event]))
  })

  it('should be able to decline invitation to the workspace', async () => {
    await createMembership(adminRole.id, user2.id, workspace1.id, prisma)

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
      type: EventType.DECLINED_INVITATION,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.arrayContaining([event]))
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
    const response = await fetchEvents(
      app,
      user2,
      'workspaceId=' + workspace1.id
    )

    const event = {
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      source: EventSource.WORKSPACE,
      triggerer: EventTriggerer.USER,
      severity: EventSeverity.INFO,
      type: EventType.ACCEPTED_INVITATION,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.arrayContaining([event]))
  })

  it('should be able to leave the workspace', async () => {
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
    expect(response.json()).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: `User ${user2.id} does not have the required authorities to perform the action`
    })
  })

  it('should have created a LEFT_WORKSPACE event', async () => {
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
      type: EventType.LEFT_WORKSPACE,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.arrayContaining([event]))
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
      type: EventType.WORKSPACE_MEMBERSHIP_UPDATED,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.arrayContaining([event]))
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
      type: EventType.REMOVED_FROM_WORKSPACE,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.arrayContaining([event]))
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
    expect(response.json()).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: `User ${user2.id} does not have the required authorities to perform the action`
    })
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
    expect(response.json()).toBeInstanceOf(Array)
    expect(response.json()).toHaveLength(1)
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
    expect(response.json()).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: `User ${user2.id} does not have the required authorities to perform the action`
    })
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
    expect(response.json()).toEqual(workspace1)
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
    expect(response.json()).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: `User ${user2.id} does not have the required authorities to perform the action`
    })
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
    expect(response.json()).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: `User ${user2.id} does not have the required authorities to perform the action`
    })
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
    const response = await app.inject({
      method: 'PUT',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/transfer-ownership/${user3.id}`
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: `User ${user3.id} is not a member of workspace ${workspace1.name} (${workspace1.id})`
    })
  })

  it('should be able to fetch all the workspaces the user is a member of', async () => {
    await createMembership(adminRole.id, user2.id, workspace1.id, prisma)
    const response = await app.inject({
      method: 'GET',
      headers: {
        'x-e2e-user-email': user2.email
      },
      url: '/workspace/all/as-user'
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([workspace2, workspace1])
  })

  it('should crash while transferring ownership if the assignee already has the Admin role(impossible case)', async () => {
    const response = await app.inject({
      method: 'PUT',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/transfer-ownership/${user2.id}`
    })

    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Error in transaction'
    })
  })

  it('should be able to transfer the ownership of the workspace', async () => {
    const user2Membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace1.id,
          userId: user2.id
        }
      }
    })

    await prisma.workspaceMemberRoleAssociation.delete({
      where: {
        roleId_workspaceMemberId: {
          roleId: adminRole.id,
          workspaceMemberId: user2Membership.id
        }
      }
    })

    await prisma.workspaceMemberRoleAssociation.create({
      data: {
        roleId: memberRole.id,
        workspaceMemberId: user2Membership.id
      }
    })

    const response = await app.inject({
      method: 'PUT',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/transfer-ownership/${user2.id}`
    })

    expect(response.statusCode).toBe(200)

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: workspace1.id
      }
    })

    expect(workspace).toEqual({
      ...workspace1,
      ownerId: user2.id,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    })
  })

  it('should not be able to transfer ownership if is not admin', async () => {
    const response = await app.inject({
      method: 'PUT',
      headers: {
        'x-e2e-user-email': user1.email
      },
      url: `/workspace/${workspace1.id}/transfer-ownership/${user2.id}`
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: `User ${user1.id} does not have the required authorities to perform the action`
    })
  })

  it('should have created a WORKSPACE_UPDATED event', async () => {
    const response = await fetchEvents(
      app,
      user2,
      'workspaceId=' + workspace1.id
    )

    const event = {
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      source: EventSource.WORKSPACE,
      triggerer: EventTriggerer.USER,
      severity: EventSeverity.INFO,
      type: EventType.WORKSPACE_UPDATED,
      timestamp: expect.any(String),
      metadata: expect.any(Object)
    }

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.arrayContaining([event]))
  })

  it('should be able to delete the workspace', async () => {
    const response = await app.inject({
      method: 'DELETE',
      headers: {
        'x-e2e-user-email': user2.email
      },
      url: `/workspace/${workspace1.id}`
    })

    expect(response.statusCode).toBe(200)

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: workspace1.id
      }
    })

    expect(workspace).toBeNull()
  })

  it('should not be able to delete a non existing workspace', async () => {
    const response = await app.inject({
      method: 'DELETE',
      headers: {
        'x-e2e-user-email': user2.email
      },
      url: `/workspace/${workspace1.id}`
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: `Workspace with id ${workspace1.id} not found`
    })
  })

  afterAll(async () => {
    await cleanUp(prisma)
  })
})
