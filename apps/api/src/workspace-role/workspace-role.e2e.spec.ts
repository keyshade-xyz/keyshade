import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { PrismaService } from '@/prisma/prisma.service'
import {
  Authority,
  EventSeverity,
  EventSource,
  EventTriggerer,
  EventType,
  Project,
  Workspace,
  WorkspaceRole
} from '@prisma/client'
import { AppModule } from '@/app/app.module'
import { WorkspaceRoleModule } from './workspace-role.module'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
import { Test } from '@nestjs/testing'
import { v4 } from 'uuid'
import { EventService } from '@/event/event.service'
import { EventModule } from '@/event/event.module'
import { WorkspaceRoleService } from './workspace-role.service'
import { UserService } from '@/user/user.service'
import { UserModule } from '@/user/user.module'
import { QueryTransformPipe } from '@/common/pipes/query.transform.pipe'
import { fetchEvents } from '@/common/event'
import { AuthenticatedUser } from '@/user/user.types'
import { HydratedWorkspaceRole } from '@/workspace-role/workspace-role.types'

describe('Workspace Role Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let eventService: EventService
  let workspaceRoleService: WorkspaceRoleService
  let userService: UserService

  let alice: AuthenticatedUser
  let bob: AuthenticatedUser
  let charlie: AuthenticatedUser
  let workspaceAlice: Workspace
  let workspaceBob: Workspace
  let adminRole1: WorkspaceRole
  let adminRole2: WorkspaceRole
  let projects: Project[]

  const USER_IP_ADDRESS = '127.0.0.1'

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, WorkspaceRoleModule, EventModule, UserModule]
    })
      .overrideProvider(MAIL_SERVICE)
      .useClass(MockMailService)
      .compile()
    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    )
    prisma = moduleRef.get(PrismaService)
    eventService = moduleRef.get(EventService)
    workspaceRoleService = moduleRef.get(WorkspaceRoleService)
    userService = moduleRef.get(UserService)

    app.useGlobalPipes(new QueryTransformPipe())

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  beforeEach(async () => {
    // Create the users
    const createAlice = await userService.createUser({
      email: 'alice@keyshade.xyz',
      name: 'Alice',
      isActive: true,
      isAdmin: false,
      isOnboardingFinished: true
    })

    const createBob = await userService.createUser({
      email: 'bob@keyshade.xyz',
      name: 'Bob',
      isActive: true,
      isAdmin: false,
      isOnboardingFinished: true
    })

    const createCharlie = await userService.createUser({
      email: 'charlie@keyshade.xyz',
      name: 'Charlie',
      isActive: true,
      isAdmin: false,
      isOnboardingFinished: true
    })

    workspaceAlice = createAlice.defaultWorkspace
    workspaceBob = createBob.defaultWorkspace

    delete createAlice.defaultWorkspace
    delete createBob.defaultWorkspace
    delete createCharlie.defaultWorkspace

    alice = {
      ...createAlice,
      ipAddress: USER_IP_ADDRESS
    }
    bob = {
      ...createBob,
      ipAddress: USER_IP_ADDRESS
    }
    charlie = {
      ...createCharlie,
      ipAddress: USER_IP_ADDRESS
    }

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

    await workspaceRoleService.createWorkspaceRole(alice, workspaceAlice.slug, {
      name: 'Member',
      description: 'Member Role',
      colorCode: '#0000FF',
      authorities: [Authority.READ_WORKSPACE_ROLE, Authority.READ_WORKSPACE]
    })

    await prisma.workspaceMember.create({
      data: {
        workspace: {
          connect: {
            id: workspaceAlice.id
          }
        },
        user: {
          connect: {
            id: charlie.id
          }
        },
        invitationAccepted: true,
        roles: {
          create: {
            role: {
              connect: {
                workspaceId_name: {
                  workspaceId: workspaceAlice.id,
                  name: 'Member'
                }
              }
            }
          }
        }
      }
    })

    projects = await prisma.$transaction([
      prisma.project.create({
        data: {
          name: 'Project 1',
          slug: 'project-1',
          description: 'Project 1 Description',
          workspaceId: workspaceAlice.id,
          publicKey: v4()
        }
      }),
      prisma.project.create({
        data: {
          name: 'Project 2',
          slug: 'project-2',
          description: 'Project 2 Description',
          workspaceId: workspaceAlice.id,
          publicKey: v4()
        }
      })
    ])
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
    expect(workspaceRoleService).toBeDefined()
    expect(userService).toBeDefined()
  })

  describe('Create Workspace Role Tests', () => {
    it('should be able to create workspace role', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/workspace-role/${workspaceAlice.slug}`,
        payload: {
          name: 'Test Role',
          description: 'Test Role Description',
          colorCode: '#0000FF',
          authorities: [
            Authority.CREATE_SECRET,
            Authority.CREATE_WORKSPACE_ROLE
          ]
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
          authorities: [
            Authority.CREATE_SECRET,
            Authority.CREATE_WORKSPACE_ROLE
          ],
          workspaceId: workspaceAlice.id,
          projects: []
        })
      )
    })

    it('should add READ_WORKSPACE authority if no authorities are provided', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/workspace-role/${workspaceAlice.slug}`,
        payload: {
          name: 'Test Role',
          description: 'Test Role Description',
          colorCode: '#0000FF'
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
          authorities: [Authority.READ_WORKSPACE],
          workspaceId: workspaceAlice.id,
          projects: []
        })
      )
    })

    it('should have created a WORKSPACE_ROLE_CREATED event', async () => {
      const response = await fetchEvents(
        eventService,
        alice,
        workspaceAlice.slug,
        EventSource.WORKSPACE_ROLE
      )

      const event = response.items[0]

      expect(event.source).toBe(EventSource.WORKSPACE_ROLE)
      expect(event.triggerer).toBe(EventTriggerer.USER)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.WORKSPACE_ROLE_CREATED)
      expect(event.workspaceId).toBe(workspaceAlice.id)
      expect(event.itemId).toBeDefined()
    })

    it('should not be able to create a workspace role for other workspace', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/workspace-role/${workspaceBob.slug}`,
        payload: {
          name: 'Test Role',
          description: 'Test Role Description',
          colorCode: '#0000FF',
          authorities: [
            Authority.CREATE_SECRET,
            Authority.CREATE_WORKSPACE_ROLE
          ]
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
        url: `/workspace-role/${workspaceAlice.slug}`,
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
      // Create a role with the same name
      await workspaceRoleService.createWorkspaceRole(
        alice,
        workspaceAlice.slug,
        {
          name: 'Test Role',
          description: 'Test Role Description',
          colorCode: '#0000FF',
          authorities: [
            Authority.CREATE_SECRET,
            Authority.CREATE_WORKSPACE_ROLE
          ]
        }
      )

      const response = await app.inject({
        method: 'POST',
        url: `/workspace-role/${workspaceAlice.slug}`,
        payload: {
          name: 'Test Role',
          description: 'Test Role Description',
          colorCode: '#0000FF',
          authorities: [
            Authority.CREATE_SECRET,
            Authority.CREATE_WORKSPACE_ROLE
          ]
        },
        headers: {
          'x-e2e-user-email': alice.email
        }
      })

      expect(response.statusCode).toBe(409)
    })

    it('should not be able to create workspace role with READ_WORKSPACE_ROLE authority', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/workspace-role/${workspaceAlice.slug}`,
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

    it('should be able to create workspace role with environment only access for projects', async () => {
      await prisma.environment.create({
        data: {
          name: 'development',
          slug: 'development',
          projectId: projects[0].id
        }
      })
      const response = await app.inject({
        method: 'POST',
        url: `/workspace-role/${workspaceAlice.slug}`,
        payload: {
          name: 'Test Role 2',
          description: 'Test Role Description',
          colorCode: '#0000FF',
          authorities: [Authority.READ_ENVIRONMENT, Authority.READ_VARIABLE],
          projectEnvironments: [
            {
              projectSlug: projects[0].slug,
              environmentSlugs: ['development']
            }
          ]
        },
        headers: {
          'x-e2e-user-email': alice.email
        }
      })

      expect(response.statusCode).toBe(201)
      const newRole = response.json() as HydratedWorkspaceRole
      const newProjects = newRole.projects

      expect(newRole.name).toBe('Test Role 2')
      expect(newRole.description).toBe('Test Role Description')
      expect(newRole.authorities).toHaveLength(2)
      expect(newProjects.length).toBe(1)
    })

    // it('should not be able to create workspace role where environments do not belong to the project', async () => {
    //   const response = await app.inject({
    //     method: 'POST',
    //     url: `/workspace-role/${workspaceAlice.slug}`,
    //     payload: {
    //       name: 'Test Role 2',
    //       description: 'Test Role Description',
    //       colorCode: '#0000FF',
    //       authorities: [Authority.READ_ENVIRONMENT, Authority.READ_VARIABLE],
    //       projectEnvironments: [
    //         {
    //           projectSlug: projects[0].slug,
    //           environmentSlugs: ['production']
    //         }
    //       ]
    //     },
    //     headers: {
    //       'x-e2e-user-email': alice.email
    //     }
    //   })
    //   expect(response.statusCode).toBe(404)
    // })

    it("should not be able to add environments that the user doesn't have read access to", async () => {
      await prisma.environment.create({
        data: {
          name: 'development',
          slug: 'development',
          projectId: projects[0].id
        }
      })
      const response = await app.inject({
        method: 'POST',
        url: `/workspace-role/${workspaceAlice.slug}`,
        payload: {
          name: 'Test Role 2',
          description: 'Test Role Description',
          colorCode: '#0000FF',
          authorities: [Authority.READ_ENVIRONMENT, Authority.READ_VARIABLE],
          projectEnvironments: [
            {
              projectSlug: projects[0].slug,
              environmentSlugs: ['development']
            }
          ]
        },
        headers: {
          'x-e2e-user-email': charlie.email
        }
      })
      expect(response.statusCode).toBe(401)
    })
  })

  it('should be able to read workspace role with READ_WORKSPACE_ROLE authority', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/workspace-role/${workspaceAlice.slug}/all`,
      headers: {
        'x-e2e-user-email': charlie.email
      }
    })

    expect(response.statusCode).toBe(200)
  })

  describe('Update Workspace Role Tests', () => {
    it('should only be able to update color code, name, description of admin authority role', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/workspace-role/${adminRole1.slug}`,
        payload: {
          description: 'Updated Description',
          colorCode: '#00FF00'
        },
        headers: {
          'x-e2e-user-email': alice.email
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().description).toEqual('Updated Description')
      expect(response.json().colorCode).toEqual('#00FF00')
    })

    it('should have created a WORKSPACE_ROLE_UPDATED event', async () => {
      // Update the workspace role
      await workspaceRoleService.updateWorkspaceRole(alice, adminRole1.slug, {
        description: 'Updated Description',
        colorCode: '#00FF00'
      })

      const response = await fetchEvents(
        eventService,
        alice,
        workspaceAlice.slug,
        EventSource.WORKSPACE_ROLE
      )

      const event = response.items[0]

      expect(event.source).toBe(EventSource.WORKSPACE_ROLE)
      expect(event.triggerer).toBe(EventTriggerer.USER)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.WORKSPACE_ROLE_UPDATED)
      expect(event.workspaceId).toBe(workspaceAlice.id)
      expect(event.itemId).toBeDefined()
    })

    it('should not be able to add WORKSPACE_ADMIN authority to the role', async () => {
      const memberRole = await prisma.workspaceRole.findFirst({
        where: {
          workspaceId: workspaceAlice.id,
          name: 'Member'
        }
      })

      const response = await app.inject({
        method: 'PUT',
        url: `/workspace-role/${memberRole.slug}`,
        payload: {
          authorities: [Authority.WORKSPACE_ADMIN]
        },
        headers: {
          'x-e2e-user-email': alice.email
        }
      })

      expect(response.statusCode).toBe(400)
    })

    it('should not be able to update workspace role of other workspace', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/workspace-role/${adminRole2.slug}`,
        payload: {
          name: 'Updated Admin',
          description: 'Updated Description',
          colorCode: '#00FF00',
          authorities: [
            Authority.CREATE_SECRET,
            Authority.CREATE_WORKSPACE_ROLE
          ]
        },
        headers: {
          'x-e2e-user-email': alice.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to update workspace role with the same name', async () => {
      const memberRole = await prisma.workspaceRole.findFirst({
        where: {
          workspaceId: workspaceAlice.id,
          name: 'Member'
        }
      })

      const response = await app.inject({
        method: 'PUT',
        url: `/workspace-role/${memberRole.slug}`,
        payload: {
          name: memberRole.name,
          description: 'Description',
          colorCode: '#00FF00',
          authorities: [
            Authority.CREATE_SECRET,
            Authority.CREATE_WORKSPACE_ROLE
          ]
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
        url: `/workspace-role/${adminRole1.slug}`,
        payload: {
          name: 'Updated Admin',
          description: 'Updated Description',
          colorCode: '#00FF00',
          authorities: [
            Authority.CREATE_SECRET,
            Authority.CREATE_WORKSPACE_ROLE
          ]
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
            name: 'Member'
          }
        },
        data: {
          authorities: {
            set: [
              Authority.UPDATE_WORKSPACE_ROLE,
              Authority.READ_WORKSPACE_ROLE
            ]
          }
        }
      })

      const dummyRole = await prisma.workspaceRole.create({
        data: {
          name: 'Dummy Role',
          slug: 'dummy-role',
          workspaceId: workspaceAlice.id,
          authorities: [Authority.CREATE_API_KEY, Authority.CREATE_SECRET]
        }
      })

      const response = await app.inject({
        method: 'PUT',
        url: `/workspace-role/${dummyRole.slug}`,
        payload: {
          name: 'Updated Dummy Role',
          description: 'Updated Description',
          colorCode: '#00FF00',
          authorities: [
            Authority.CREATE_SECRET,
            Authority.CREATE_WORKSPACE_ROLE
          ]
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
          slug: expect.any(String),
          description: 'Updated Description',
          colorCode: '#00FF00',
          authorities: [
            Authority.CREATE_SECRET,
            Authority.CREATE_WORKSPACE_ROLE
          ],
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

    // it('should be able to add environment access for projects to the role', async () => {
    //   await prisma.environment.create({
    //     data: {
    //       name: 'dev',
    //       slug: 'dev',
    //       projectId: projects[0].id
    //     }
    //   })
    //   await prisma.environment.create({
    //     data: {
    //       name: 'stage',
    //       slug: 'stage',
    //       projectId: projects[1].id
    //     }
    //   })
    //
    //   const response = await app.inject({
    //     method: 'PUT',
    //     url: `/workspace-role/${adminRole1.slug}`,
    //     payload: {
    //       projectEnvironments: [
    //         {
    //           projectSlug: projects[0].slug,
    //           environmentSlugs: ['dev']
    //         },
    //         {
    //           projectSlug: projects[1].slug,
    //           environmentSlugs: ['stage']
    //         }
    //       ]
    //     },
    //     headers: {
    //       'x-e2e-user-email': alice.email
    //     }
    //   })
    //
    //   expect(response.statusCode).toBe(200)
    // })

    // it('should be able to add environment access for projects to the role with READ_WORKSPACE, UPDATE_WORKSPACE_ROLE, READ_PROJECT, READ_ENVIRONMENT authorities', async () => {
    //   const devEnvironment = await prisma.environment.create({
    //     data: {
    //       name: 'dev',
    //       slug: 'dev',
    //       projectId: projects[0].id
    //     }
    //   })
    //   const stageEnvironment = await prisma.environment.create({
    //     data: {
    //       name: 'stage',
    //       slug: 'stage',
    //       projectId: projects[1].id
    //     }
    //   })
    //   // update the workspace member role with the required authorities
    //   await prisma.workspaceRole.update({
    //     where: {
    //       workspaceId_name: {
    //         workspaceId: workspaceAlice.id,
    //         name: 'Member'
    //       }
    //     },
    //     data: {
    //       authorities: {
    //         set: [
    //           Authority.UPDATE_WORKSPACE_ROLE,
    //           Authority.READ_PROJECT,
    //           Authority.READ_WORKSPACE_ROLE,
    //           Authority.READ_ENVIRONMENT
    //         ]
    //       },
    //       projects: {
    //         create: [
    //           {
    //             project: {
    //               connect: {
    //                 id: projects[0].id
    //               }
    //             },
    //             environments: {
    //               connect: {
    //                 id: devEnvironment.id
    //               }
    //             }
    //           },
    //           {
    //             project: {
    //               connect: {
    //                 id: projects[1].id
    //               }
    //             },
    //             environments: {
    //               connect: { id: stageEnvironment.id }
    //             }
    //           }
    //         ]
    //       }
    //     }
    //   })
    //
    //   const response = await app.inject({
    //     method: 'PUT',
    //     url: `/workspace-role/${adminRole1.slug}`,
    //     payload: {
    //       projectEnvironments: [
    //         {
    //           projectSlug: projects[0].slug,
    //           environmentSlugs: ['dev']
    //         },
    //         {
    //           projectSlug: projects[1].slug,
    //           environmentSlugs: ['stage']
    //         }
    //       ]
    //     },
    //     headers: {
    //       'x-e2e-user-email': charlie.email
    //     }
    //   })
    //   expect(response.statusCode).toBe(200)
    // })

    it('should not be able to add projects to the role without UPDATE_WORKSPACE_ROLE and READ_PROJECT authorities', async () => {
      await prisma.workspaceRole.update({
        where: {
          workspaceId_name: {
            workspaceId: workspaceAlice.id,
            name: 'Member'
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
        url: `/workspace-role/${adminRole1.slug}`,
        payload: {
          projectIds: projects.map((project) => project.id)
        },
        headers: {
          'x-e2e-user-email': charlie.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    // it('should not be able to update the workspace role with environments that do not belong to the project', async () => {
    //   const response = await app.inject({
    //     method: 'PUT',
    //     url: `/workspace-role/${adminRole1.slug}`,
    //     payload: {
    //       projectEnvironments: [
    //         {
    //           projectSlug: projects[0].slug,
    //           environmentSlugs: ['production']
    //         }
    //       ]
    //     },
    //     headers: {
    //       'x-e2e-user-email': alice.email
    //     }
    //   })
    //
    //   expect(response.statusCode).toBe(404)
    // })

    it('should not be able to update the workspace role with environments that the user does not have read access to', async () => {
      await prisma.environment.create({
        data: {
          name: 'dev',
          slug: 'dev',
          projectId: projects[0].id
        }
      })
      const response = await app.inject({
        method: 'PUT',
        url: `/workspace-role/${adminRole1.slug}`,
        payload: {
          projectEnvironments: [
            {
              projectSlug: projects[0].slug,
              environmentSlugs: ['dev']
            }
          ]
        },
        headers: {
          'x-e2e-user-email': charlie.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not allow updating admin role authorities', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/workspace-role/${adminRole1.slug}`,
        payload: {
          authorities: [Authority.CREATE_SECRET, Authority.WORKSPACE_ADMIN]
        },
        headers: {
          'x-e2e-user-email': alice.email
        }
      })
      expect(response.statusCode).toBe(400)
    })
  })

  describe('Delete Workspace Role Tests', () => {
    it('should not be able to delete the workspace role with READ_WORKSPACE_ROLE authority', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/workspace-role/${adminRole1.slug}`,
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
            name: 'Member'
          }
        },
        data: {
          authorities: {
            set: [
              Authority.DELETE_WORKSPACE_ROLE,
              Authority.READ_WORKSPACE_ROLE
            ]
          }
        }
      })

      const dummyRole = await prisma.workspaceRole.create({
        data: {
          name: 'Dummy Role',
          slug: 'dummy-role',
          workspaceId: workspaceAlice.id,
          authorities: [Authority.CREATE_API_KEY, Authority.CREATE_SECRET]
        }
      })

      const response = await app.inject({
        method: 'DELETE',
        url: `/workspace-role/${dummyRole.slug}`,
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
          slug: 'dummy-role',
          workspaceId: workspaceAlice.id,
          authorities: [Authority.CREATE_API_KEY, Authority.CREATE_SECRET]
        }
      })

      const response = await app.inject({
        method: 'DELETE',
        url: `/workspace-role/${dummyRole.slug}`,
        headers: {
          'x-e2e-user-email': alice.email
        }
      })

      expect(response.statusCode).toBe(200)
    })

    it('should have created a WORKSPACE_ROLE_DELETED event', async () => {
      // Fetch the member role
      const memberRole = await prisma.workspaceRole.findFirst({
        where: {
          workspaceId: workspaceAlice.id,
          name: 'Member'
        }
      })

      // Delete the workspace role
      await workspaceRoleService.deleteWorkspaceRole(alice, memberRole.slug)

      const response = await fetchEvents(
        eventService,
        alice,
        workspaceAlice.slug,
        EventSource.WORKSPACE_ROLE
      )

      const event = response.items[0]

      expect(event.source).toBe(EventSource.WORKSPACE_ROLE)
      expect(event.triggerer).toBe(EventTriggerer.USER)
      expect(event.severity).toBe(EventSeverity.INFO)
      expect(event.type).toBe(EventType.WORKSPACE_ROLE_DELETED)
      expect(event.workspaceId).toBe(workspaceAlice.id)
      expect(event.itemId).toBeDefined()
    })

    it('should not be able to delete the auto generated admin role', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/workspace-role/${adminRole1.slug}`,
        headers: {
          'x-e2e-user-email': alice.email
        }
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not be able to delete role of other workspace', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/workspace-role/${adminRole2.slug}`,
        headers: {
          'x-e2e-user-email': alice.email
        }
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Get All Workspace Role Tests', () => {
    it('should be able to fetch all the roles of a workspace with WORKSPACE_ADMIN role', async () => {
      const roles = await prisma.workspaceRole
        .findMany({
          where: {
            workspaceId: workspaceAlice.id
          },
          include: {
            projects: {
              select: {
                project: {
                  select: {
                    id: true,
                    slug: true,
                    name: true
                  }
                },
                environments: {
                  select: {
                    id: true,
                    slug: true,
                    name: true
                  }
                }
              }
            }
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
        url: `/workspace-role/${workspaceAlice.slug}/all`,
        headers: {
          'x-e2e-user-email': charlie.email
        }
      })

      expect(response.statusCode).toBe(200)

      //check metadata
      const metadata = response.json().metadata
      expect(metadata.totalCount).toBe(roles.length)
      expect(metadata.links.self).toEqual(
        `/workspace-role/${workspaceAlice.slug}/all?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.first).toEqual(
        `/workspace-role/${workspaceAlice.slug}/all?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.previous).toBeNull()
      expect(metadata.links.next).toBeNull()
      expect(metadata.links.last).toEqual(
        `/workspace-role/${workspaceAlice.slug}/all?page=0&limit=10&sort=name&order=asc&search=`
      )
    })

    it('should be able to fetch all the roles of a workspace with READ_WORKSPACE_ROLE role', async () => {
      await prisma.workspaceRole.update({
        where: {
          workspaceId_name: {
            workspaceId: workspaceAlice.id,
            name: 'Member'
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
          },
          include: {
            projects: {
              select: {
                project: {
                  select: {
                    id: true,
                    slug: true,
                    name: true
                  }
                },
                environments: {
                  select: {
                    id: true,
                    slug: true,
                    name: true
                  }
                }
              }
            }
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
        url: `/workspace-role/${workspaceAlice.slug}/all`,
        headers: {
          'x-e2e-user-email': charlie.email
        }
      })

      expect(response.statusCode).toBe(200)

      //check metadata
      const metadata = response.json().metadata
      expect(metadata.totalCount).toBe(roles.length)
      expect(metadata.links.self).toEqual(
        `/workspace-role/${workspaceAlice.slug}/all?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.first).toEqual(
        `/workspace-role/${workspaceAlice.slug}/all?page=0&limit=10&sort=name&order=asc&search=`
      )
      expect(metadata.links.previous).toBeNull()
      expect(metadata.links.next).toBeNull()
      expect(metadata.links.last).toEqual(
        `/workspace-role/${workspaceAlice.slug}/all?page=0&limit=10&sort=name&order=asc&search=`
      )
    })

    it('should not be able to fetch all the roles of a workspace without READ_WORKSPACE_ROLE role', async () => {
      await prisma.workspaceRole.update({
        where: {
          workspaceId_name: {
            workspaceId: workspaceAlice.id,
            name: 'Member'
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
        url: `/workspace/${workspaceAlice.slug}`,
        headers: {
          'x-e2e-user-email': bob.email
        }
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
