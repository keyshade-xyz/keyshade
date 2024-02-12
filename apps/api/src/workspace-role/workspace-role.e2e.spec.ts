import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { PrismaService } from '../prisma/prisma.service'
import {
  Authority,
  Project,
  User,
  Workspace,
  WorkspaceRole
} from '@prisma/client'
import { AppModule } from '../app/app.module'
import { WorkspaceRoleModule } from './workspace-role.module'
import { MAIL_SERVICE } from '../mail/services/interface.service'
import { MockMailService } from '../mail/services/mock.service'
import { Test } from '@nestjs/testing'
import { v4 } from 'uuid'
import cleanUp from '../common/cleanup'

describe('Workspace Role Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService

  let alice: User
  let bob: User
  let charlie: User
  let workspaceAlice: Workspace
  let workspaceBob: Workspace
  let adminRole1: WorkspaceRole
  let adminRole2: WorkspaceRole
  let projects: Project[]

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, WorkspaceRoleModule]
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

    await cleanUp(prisma)

    const aliceId = v4()
    const bobId = v4()
    const charlieId = v4()
    const workspaceAliceId = v4()
    const workspaceBobId = v4()

    // Create the users
    const createAlice = prisma.user.create({
      data: {
        id: aliceId,
        email: 'alice@keyshade.xyz',
        name: 'Alice',
        isActive: true,
        isAdmin: false,
        isOnboardingFinished: true
      }
    })

    const createBob = prisma.user.create({
      data: {
        id: bobId,
        email: 'bob@keyshade.xyz',
        name: 'Bob',
        isActive: true,
        isAdmin: false,
        isOnboardingFinished: true
      }
    })

    const createCharlie = prisma.user.create({
      data: {
        id: charlieId,
        email: 'charlie@keyshade.xyz',
        name: 'Charlie',
        isActive: true,
        isAdmin: false,
        isOnboardingFinished: true
      }
    })

    // Create the workspaces
    const createWorkspaceAlice = prisma.workspace.create({
      data: {
        id: workspaceAliceId,
        name: 'Test Workspace for Alice',
        description: 'Test Workspace Description',
        isFreeTier: true,
        ownerId: workspaceBobId,
        roles: {
          createMany: {
            data: [
              {
                name: 'Admin',
                authorities: [Authority.WORKSPACE_ADMIN],
                hasAdminAuthority: true,
                colorCode: '#FF0000'
              },
              {
                name: 'Viewer',
                authorities: [Authority.READ_WORKSPACE_ROLE]
              }
            ]
          }
        }
      }
    })

    const createWorkspaceBob = prisma.workspace.create({
      data: {
        id: workspaceBobId,
        name: 'Test Workspace for Bob',
        description: 'Test Workspace Description',
        isFreeTier: true,
        ownerId: bobId,
        roles: {
          createMany: {
            data: [
              {
                name: 'Admin',
                authorities: [Authority.WORKSPACE_ADMIN],
                hasAdminAuthority: true,
                colorCode: '#FF0000'
              }
            ]
          }
        }
      }
    })

    // Add the owners to the workspaces
    const assignOwnershipForAlice = prisma.workspaceMember.create({
      data: {
        workspace: {
          connect: {
            id: workspaceAliceId
          }
        },
        user: {
          connect: {
            id: aliceId
          }
        },
        invitationAccepted: true,
        roles: {
          create: {
            role: {
              connect: {
                workspaceId_name: {
                  workspaceId: workspaceAliceId,
                  name: 'Admin'
                }
              }
            }
          }
        }
      }
    })

    const assignOwnershipForBob = prisma.workspaceMember.create({
      data: {
        workspace: {
          connect: {
            id: workspaceBobId
          }
        },
        user: {
          connect: {
            id: bobId
          }
        },
        invitationAccepted: true,
        roles: {
          create: {
            role: {
              connect: {
                workspaceId_name: {
                  workspaceId: workspaceBobId,
                  name: 'Admin'
                }
              }
            }
          }
        }
      }
    })

    const assignRoleForCharlie = prisma.workspaceMember.create({
      data: {
        workspace: {
          connect: {
            id: workspaceAliceId
          }
        },
        user: {
          connect: {
            id: charlieId
          }
        },
        invitationAccepted: true,
        roles: {
          create: {
            role: {
              connect: {
                workspaceId_name: {
                  workspaceId: workspaceAliceId,
                  name: 'Viewer'
                }
              }
            }
          }
        }
      }
    })

    const result = await prisma.$transaction([
      createAlice,
      createBob,
      createCharlie,
      createWorkspaceAlice,
      createWorkspaceBob,
      assignOwnershipForAlice,
      assignOwnershipForBob,
      assignRoleForCharlie
    ])

    alice = result[0]
    bob = result[1]
    charlie = result[2]
    workspaceAlice = result[3]
    workspaceBob = result[4]

    adminRole1 = await prisma.workspaceRole.findFirst({
      where: {
        workspaceId: workspaceAlice.id,
        hasAdminAuthority: true
      }
    })

    adminRole2 = await prisma.workspaceRole.findFirst({
      where: {
        workspaceId: workspaceBob.id,
        hasAdminAuthority: true
      }
    })

    projects = await prisma.$transaction([
      prisma.project.create({
        data: {
          name: 'Project 1',
          description: 'Project 1 Description',
          workspaceId: workspaceAlice.id,
          publicKey: v4()
        }
      }),
      prisma.project.create({
        data: {
          name: 'Project 2',
          description: 'Project 2 Description',
          workspaceId: workspaceAlice.id,
          publicKey: v4()
        }
      })
    ])
  })

  it('should be defined', () => {
    expect(app).toBeDefined()
  })

  it('should be able to get the auto generated admin role', async () => {
    const response = await app.inject({
      method: 'GET',
      headers: {
        'x-e2e-user-email': alice.email
      },
      url: `/workspace-role/${adminRole1.id}`
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      ...adminRole1,
      createdAt: expect.any(String),
      projects: [],
      updatedAt: expect.any(String)
    })
  })

  it('should not be able to get the auto generated admin role of other workspace', async () => {
    const response = await app.inject({
      method: 'GET',
      headers: {
        'x-e2e-user-email': alice.email
      },
      url: `/workspace-role/${adminRole2.id}`
    })

    expect(response.statusCode).toBe(401)
  })

  it('should be able to create workspace role', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/workspace-role/${workspaceAlice.id}`,
      payload: {
        name: 'Test Role',
        description: 'Test Role Description',
        colorCode: '#0000FF',
        authorities: [Authority.CREATE_SECRET, Authority.CREATE_WORKSPACE_ROLE]
      },
      headers: {
        'x-e2e-user-email': alice.email
      }
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Test Role',
        description: 'Test Role Description',
        colorCode: '#0000FF',
        authorities: [Authority.CREATE_SECRET, Authority.CREATE_WORKSPACE_ROLE],
        workspaceId: workspaceAlice.id,
        projects: []
      })
    )
  })

  it('should not be able to create a workspace role for other workspace', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/workspace-role/${workspaceBob.id}`,
      payload: {
        name: 'Test Role',
        description: 'Test Role Description',
        colorCode: '#0000FF',
        authorities: [Authority.CREATE_SECRET, Authority.CREATE_WORKSPACE_ROLE]
      },
      headers: {
        'x-e2e-user-email': alice.email
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should not be able to create a workspace role with WORKSPACE_ADMIN authority', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/workspace-role/${workspaceAlice.id}`,
      payload: {
        name: 'Test Role',
        description: 'Test Role Description',
        colorCode: '#0000FF',
        authorities: [Authority.WORKSPACE_ADMIN]
      },
      headers: {
        'x-e2e-user-email': alice.email
      }
    })

    expect(response.statusCode).toBe(400)
  })

  it('should not be able to create a workspace role with the same name', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/workspace-role/${workspaceAlice.id}`,
      payload: {
        name: 'Test Role',
        description: 'Test Role Description',
        colorCode: '#0000FF',
        authorities: [Authority.CREATE_SECRET, Authority.CREATE_WORKSPACE_ROLE]
      },
      headers: {
        'x-e2e-user-email': alice.email
      }
    })

    expect(response.statusCode).toBe(409)
  })

  it('should be able to read workspace role with READ_WORKSPACE_ROLE authority', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/workspace-role/${adminRole1.id}`,
      headers: {
        'x-e2e-user-email': charlie.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      ...adminRole1,
      createdAt: expect.any(String),
      projects: [],
      updatedAt: expect.any(String)
    })
  })

  it('should not be able to create workspace role with READ_WORKSPACE_ROLE authority', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/workspace-role/${workspaceAlice.id}`,
      payload: {
        name: 'Test Role 2',
        description: 'Test Role Description',
        colorCode: '#0000FF',
        authorities: [Authority.READ_WORKSPACE_ROLE]
      },
      headers: {
        'x-e2e-user-email': charlie.email
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should only be able to update color code, name, description of admin authority role', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/workspace-role/${adminRole1.id}`,
      payload: {
        name: 'Updated Admin',
        description: 'Updated Description',
        colorCode: '#00FF00'
      },
      headers: {
        'x-e2e-user-email': alice.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      id: adminRole1.id,
      name: 'Updated Admin',
      description: 'Updated Description',
      colorCode: '#00FF00',
      authorities: [Authority.WORKSPACE_ADMIN],
      workspaceId: workspaceAlice.id,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      hasAdminAuthority: true,
      projects: []
    })

    adminRole1 = response.json()
  })

  it('should not be able to update workspace role of other workspace', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/workspace-role/${adminRole2.id}`,
      payload: {
        name: 'Updated Admin',
        description: 'Updated Description',
        colorCode: '#00FF00',
        authorities: [Authority.CREATE_SECRET, Authority.CREATE_WORKSPACE_ROLE]
      },
      headers: {
        'x-e2e-user-email': alice.email
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should not be able to update workspace role with the same name', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/workspace-role/${adminRole1.id}`,
      payload: {
        name: 'Updated Admin',
        description: 'Updated Description',
        colorCode: '#00FF00',
        authorities: [Authority.CREATE_SECRET, Authority.CREATE_WORKSPACE_ROLE]
      },
      headers: {
        'x-e2e-user-email': alice.email
      }
    })

    expect(response.statusCode).toBe(409)
  })

  it('should not be able to update the workspace role with READ_WORKSPACE_ROLE authority', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/workspace-role/${adminRole1.id}`,
      payload: {
        name: 'Updated Admin',
        description: 'Updated Description',
        colorCode: '#00FF00',
        authorities: [Authority.CREATE_SECRET, Authority.CREATE_WORKSPACE_ROLE]
      },
      headers: {
        'x-e2e-user-email': charlie.email
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should be able to update the workspace role with UPDATE_WORKSPACE_ROLE authority', async () => {
    await prisma.workspaceRole.update({
      where: {
        workspaceId_name: {
          workspaceId: workspaceAlice.id,
          name: 'Viewer'
        }
      },
      data: {
        authorities: {
          set: [Authority.UPDATE_WORKSPACE_ROLE, Authority.READ_WORKSPACE_ROLE]
        }
      }
    })

    const dummyRole = await prisma.workspaceRole.create({
      data: {
        name: 'Dummy Role',
        workspaceId: workspaceAlice.id,
        authorities: [Authority.CREATE_API_KEY, Authority.CREATE_SECRET]
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/workspace-role/${dummyRole.id}`,
      payload: {
        name: 'Updated Dummy Role',
        description: 'Updated Description',
        colorCode: '#00FF00',
        authorities: [Authority.CREATE_SECRET, Authority.CREATE_WORKSPACE_ROLE]
      },
      headers: {
        'x-e2e-user-email': charlie.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(
      expect.objectContaining({
        id: dummyRole.id,
        name: 'Updated Dummy Role',
        description: 'Updated Description',
        colorCode: '#00FF00',
        authorities: [Authority.CREATE_SECRET, Authority.CREATE_WORKSPACE_ROLE],
        workspaceId: workspaceAlice.id,
        projects: []
      })
    )

    await prisma.workspaceRole.delete({
      where: {
        id: dummyRole.id
      }
    })
  })

  it('should not be able to delete the workspace role with READ_WORKSPACE_ROLE authority', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/workspace-role/${adminRole1.id}`,
      headers: {
        'x-e2e-user-email': charlie.email
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should be able to delete the workspace role with DELETE_WORKSPACE_ROLE authority', async () => {
    await prisma.workspaceRole.update({
      where: {
        workspaceId_name: {
          workspaceId: workspaceAlice.id,
          name: 'Viewer'
        }
      },
      data: {
        authorities: {
          set: [Authority.DELETE_WORKSPACE_ROLE, Authority.READ_WORKSPACE_ROLE]
        }
      }
    })

    const dummyRole = await prisma.workspaceRole.create({
      data: {
        name: 'Dummy Role',
        workspaceId: workspaceAlice.id,
        authorities: [Authority.CREATE_API_KEY, Authority.CREATE_SECRET]
      }
    })

    const response = await app.inject({
      method: 'DELETE',
      url: `/workspace-role/${dummyRole.id}`,
      headers: {
        'x-e2e-user-email': charlie.email
      }
    })

    expect(response.statusCode).toBe(200)
  })

  it('should be able to delete workspace role with WORKSPACE_ADMIN authority', async () => {
    const dummyRole = await prisma.workspaceRole.create({
      data: {
        name: 'Dummy Role',
        workspaceId: workspaceAlice.id,
        authorities: [Authority.CREATE_API_KEY, Authority.CREATE_SECRET]
      }
    })

    const response = await app.inject({
      method: 'DELETE',
      url: `/workspace-role/${dummyRole.id}`,
      headers: {
        'x-e2e-user-email': alice.email
      }
    })

    expect(response.statusCode).toBe(200)
  })

  it('should not be able to delete the auto generated admin role', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/workspace-role/${adminRole1.id}`,
      headers: {
        'x-e2e-user-email': alice.email
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should not be able to delete role of other workspace', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/workspace-role/${adminRole2.id}`,
      headers: {
        'x-e2e-user-email': alice.email
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should be able to check if the workspace role exists', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/workspace-role/${workspaceAlice.id}/exists/Viewer`,
      headers: {
        'x-e2e-user-email': charlie.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      exists: true
    })
  })

  it('should be able to check if the workspace role exists(2)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/workspace-role/${workspaceAlice.id}/exists/new-stuff`,
      headers: {
        'x-e2e-user-email': charlie.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      exists: false
    })
  })

  it('should not be able to check if the workspace role exists for other workspace', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/workspace-role/${workspaceBob.id}/exists/Viewer`,
      headers: {
        'x-e2e-user-email': charlie.email
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should be able to fetch all the roles of a workspace with WORKSPACE_ADMIN role', async () => {
    const roles = await prisma.workspaceRole
      .findMany({
        where: {
          workspaceId: workspaceAlice.id
        }
      })
      .then((roles) =>
        roles.map((role) => ({
          ...role,
          createdAt: role.createdAt.toISOString(),
          updatedAt: role.updatedAt.toISOString()
        }))
      )

    const response = await app.inject({
      method: 'GET',
      url: `/workspace-role/${workspaceAlice.id}/all`,
      headers: {
        'x-e2e-user-email': charlie.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.arrayContaining(roles))
  })

  it('should be able to fetch all the roles of a workspace with READ_WORKSPACE_ROLE role', async () => {
    await prisma.workspaceRole.update({
      where: {
        workspaceId_name: {
          workspaceId: workspaceAlice.id,
          name: 'Viewer'
        }
      },
      data: {
        authorities: {
          set: [Authority.READ_WORKSPACE_ROLE]
        }
      }
    })

    const roles = await prisma.workspaceRole
      .findMany({
        where: {
          workspaceId: workspaceAlice.id
        }
      })
      .then((roles) =>
        roles.map((role) => ({
          ...role,
          createdAt: role.createdAt.toISOString(),
          updatedAt: role.updatedAt.toISOString()
        }))
      )

    const response = await app.inject({
      method: 'GET',
      url: `/workspace-role/${workspaceAlice.id}/all`,
      headers: {
        'x-e2e-user-email': charlie.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.arrayContaining(roles))
  })

  it('should not be able to fetch all the roles of a workspace without READ_WORKSPACE_ROLE role', async () => {
    await prisma.workspaceRole.update({
      where: {
        workspaceId_name: {
          workspaceId: workspaceAlice.id,
          name: 'Viewer'
        }
      },
      data: {
        authorities: {
          set: [Authority.CREATE_WORKSPACE_ROLE]
        }
      }
    })

    const response = await app.inject({
      method: 'GET',
      url: `/workspace/${workspaceAlice.id}`,
      headers: {
        'x-e2e-user-email': bob.email
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should be able to add projects to the role', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/workspace-role/${adminRole1.id}`,
      payload: {
        projectIds: projects.map((project) => project.id)
      },
      headers: {
        'x-e2e-user-email': alice.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      ...adminRole1,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      projects: expect.arrayContaining([
        {
          id: projects[0].id
        },
        {
          id: projects[1].id
        }
      ])
    })
  })

  it('should be able to add projects to the role with UPDATE_WORKSPACE_ROLE and READ_PROJECT authorities', async () => {
    await prisma.workspaceRole.update({
      where: {
        workspaceId_name: {
          workspaceId: workspaceAlice.id,
          name: 'Viewer'
        }
      },
      data: {
        authorities: {
          set: [
            Authority.UPDATE_WORKSPACE_ROLE,
            Authority.READ_PROJECT,
            Authority.READ_WORKSPACE_ROLE
          ]
        }
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/workspace-role/${adminRole1.id}`,
      payload: {
        projectIds: projects.map((project) => project.id)
      },
      headers: {
        'x-e2e-user-email': charlie.email
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      ...adminRole1,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      hasAdminAuthority: true,
      projects: expect.arrayContaining([
        {
          id: projects[0].id
        },
        {
          id: projects[1].id
        }
      ])
    })

    adminRole1 = response.json()
  })

  it('should not be able to add projects to the role without UPDATE_WORKSPACE_ROLE and READ_PROJECT authorities', async () => {
    await prisma.workspaceRole.update({
      where: {
        workspaceId_name: {
          workspaceId: workspaceAlice.id,
          name: 'Viewer'
        }
      },
      data: {
        authorities: {
          set: [Authority.READ_WORKSPACE_ROLE]
        }
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/workspace-role/${adminRole1.id}`,
      payload: {
        projectIds: projects.map((project) => project.id)
      },
      headers: {
        'x-e2e-user-email': charlie.email
      }
    })

    expect(response.statusCode).toBe(401)
  })

  afterAll(async () => {
    await cleanUp(prisma)
  })
})
