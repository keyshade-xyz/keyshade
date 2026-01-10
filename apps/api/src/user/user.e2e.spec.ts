import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import { UserModule } from './user.module'
import { PrismaService } from '@/prisma/prisma.service'
import { AppModule } from '@/app/app.module'
import { User } from '@prisma/client'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
import { UserService } from './service/user.service'

describe('User Controller Tests', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let userService: UserService

  let adminUser: User
  let regularUser: User

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, UserModule]
    })
      .overrideProvider(MAIL_SERVICE)
      .useClass(MockMailService)
      .compile()
    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    )
    prisma = moduleRef.get(PrismaService)
    userService = moduleRef.get(UserService)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  beforeEach(async () => {
    adminUser = await userService.createUser({
      email: 'admin@keyshade.io',
      name: 'Admin',
      isActive: true,
      isAdmin: true,
      isOnboardingFinished: true
    })

    regularUser = await userService.createUser({
      email: 'John@keyshade.io',
      name: 'John',
      isActive: true,
      isAdmin: false,
      isOnboardingFinished: true
    })

    // @ts-expect-error - We don't need the default workspace for these tests
    delete regularUser.defaultWorkspace
    // @ts-expect-error - We don't need the default workspace for these tests
    delete adminUser.defaultWorkspace
  })

  afterEach(async () => {
    // Delete the users
    await prisma.user.deleteMany()
    // Delete the workspaces
    await prisma.workspace.deleteMany()
  })

  it('should be defined', () => {
    expect(app).toBeDefined()
    expect(prisma).toBeDefined()
    expect(userService).toBeDefined()
  })

  it(`should be able to get self as admin`, async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/user',
      headers: {
        'x-e2e-user-email': adminUser.email
      }
    })
    expect(result.statusCode).toEqual(200)
  })

  it(`should be able to get self as user`, async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/user',
      headers: {
        'x-e2e-user-email': regularUser.email
      }
    })

    const workspace = await prisma.workspace.findFirst({
      where: {
        ownerId: regularUser.id,
        isDefault: true
      }
    })

    expect(result.statusCode).toEqual(200)

    expect(result.json().defaultWorkspace).toMatchObject({
      id: workspace.id,
      name: workspace.name
    })
  })

  it('should have created a default workspace', async () => {
    const createUserResponse = await userService.createUser({
      email: 'jane@keyshade.io',
      name: 'Jane',
      isAdmin: false,
      isActive: true,
      isOnboardingFinished: true,
      profilePictureUrl: null
    })

    expect(createUserResponse.defaultWorkspace).toBeDefined()
    expect(createUserResponse.defaultWorkspace.name).toEqual('My Workspace')
    expect(createUserResponse.defaultWorkspace.isDefault).toEqual(true)
    expect(createUserResponse.defaultWorkspace.ownerId).toEqual(
      createUserResponse.id
    )

    const workspace = await prisma.workspace.findFirst({
      where: {
        ownerId: createUserResponse.id,
        isDefault: true
      }
    })

    expect(workspace).toBeDefined()
    expect(workspace.name).toEqual('My Workspace')
    expect(workspace.isDefault).toEqual(true)
    expect(workspace.ownerId).toEqual(createUserResponse.id)
  })

  it('should have created an example project in the default workspace', async () => {
    const createUserResponse = await userService.createUser({
      email: 'jane@keyshade.io',
      name: 'Jane',
      isAdmin: false,
      isActive: true,
      isOnboardingFinished: true,
      profilePictureUrl: null
    })
    const workspace = await prisma.workspace.findFirst({
      where: {
        ownerId: createUserResponse.id,
        isDefault: true
      }
    })

    expect(workspace).toBeDefined()

    // Check project validity
    const projectsResponse = await app.inject({
      method: 'GET',
      url: `/project/all/${workspace.slug}`,
      headers: {
        'x-e2e-user-email': 'jane@keyshade.io'
      }
    })
    expect(projectsResponse.statusCode).toBe(200)
    expect(projectsResponse.json().items).toHaveLength(1)
    const exampleProject = projectsResponse.json().items[0]
    expect(exampleProject).toBeDefined()
    expect(exampleProject.name).toBe('Example Project')

    // Check environments
    const environmentsResponse = await app.inject({
      method: 'GET',
      url: `/environment/all/${exampleProject.slug}`,
      headers: {
        'x-e2e-user-email': 'jane@keyshade.io'
      }
    })
    expect(environmentsResponse.statusCode).toBe(200)
    expect(environmentsResponse.json().items).toHaveLength(3)

    // Check secrets validity
    const secretsResponse = await app.inject({
      method: 'GET',
      url: `/secret/${exampleProject.slug}`,
      headers: {
        'x-e2e-user-email': 'jane@keyshade.io'
      }
    })
    expect(secretsResponse.statusCode).toBe(200)
    expect(secretsResponse.json().items).toHaveLength(2)
    expect(secretsResponse.json().items[0].versions).toHaveLength(2)

    // Check variables validity
    const variablesResponse = await app.inject({
      method: 'GET',
      url: `/variable/${exampleProject.slug}`,
      headers: {
        'x-e2e-user-email': 'jane@keyshade.io'
      }
    })
    expect(variablesResponse.statusCode).toBe(200)
    expect(variablesResponse.json().items).toHaveLength(2)
    expect(variablesResponse.json().items[0].versions).toHaveLength(2)
  })

  it('should skip workspace creation for admin users', async () => {
    const createAdminUserResponse = await userService.createUser({
      email: '',
      isAdmin: true,
      isOnboardingFinished: true,
      profilePictureUrl: null
    })

    expect(createAdminUserResponse.defaultWorkspace).toBeNull()

    const workspace = await prisma.workspace.findFirst({
      where: {
        ownerId: createAdminUserResponse.id,
        isDefault: true
      }
    })

    expect(workspace).toBeNull()
  })

  test('regular user should not be able to access other routes if onboarding is not finished', async () => {
    // Flip the user's onboarding status to false
    await prisma.user.update({
      where: {
        email: regularUser.email
      },
      data: {
        isOnboardingFinished: false
      }
    })

    const result = await app.inject({
      method: 'DELETE',
      url: '/user',
      headers: {
        'x-e2e-user-email': regularUser.email
      }
    })
    expect(result.statusCode).toEqual(401)
  })

  test('admin user should not be able to access other routes if onboarding is not finished', async () => {
    // Flip the user's onboarding status to false
    await prisma.user.update({
      where: {
        email: adminUser.email
      },
      data: {
        isOnboardingFinished: false
      }
    })

    const result = await app.inject({
      method: 'DELETE',
      url: '/user',
      headers: {
        'x-e2e-user-email': adminUser.email
      }
    })
    expect(result.statusCode).toEqual(401)
  })

  test('user should be able to update themselves', async () => {
    const result = await app.inject({
      method: 'PUT',
      url: '/user',
      headers: {
        'x-e2e-user-email': regularUser.email
      },
      payload: {
        name: 'John Doe'
      }
    })
    expect(result.statusCode).toEqual(200)
    expect(JSON.parse(result.body).name).toEqual('John Doe')

    regularUser = JSON.parse(result.body)
  })

  describe('Onboarding and Referral Tests', () => {
    beforeEach(async () => {
      // Flip the user's onboarding status to false
      await prisma.user.update({
        where: {
          email: regularUser.email
        },
        data: {
          isOnboardingFinished: false
        }
      })
    })

    test('users should be able to finish onboarding', async () => {
      const result = await app.inject({
        method: 'PUT',
        url: '/user/onboarding',
        headers: {
          'x-e2e-user-email': regularUser.email
        },
        payload: {
          teamSize: '4-10',
          heardFrom: 'Google'
        }
      })
      expect(result.statusCode).toEqual(200)
      expect(JSON.parse(result.body).isOnboardingFinished).toEqual(true)

      const onboardingAnswers = await prisma.onboardingAnswers.findFirst({
        where: {
          userId: regularUser.id
        }
      })

      expect(onboardingAnswers.heardFrom).toEqual('Google')
      expect(onboardingAnswers.teamSize).toEqual('4-10')
    })

    test('users should not be able to finish onboarding twice', async () => {
      await prisma.user.update({
        where: {
          email: regularUser.email
        },
        data: {
          isOnboardingFinished: true
        }
      })

      const result = await app.inject({
        method: 'PUT',
        url: '/user/onboarding',
        headers: {
          'x-e2e-user-email': regularUser.email
        },
        payload: {
          teamSize: '4-10',
          heardFrom: 'Google'
        }
      })
      expect(result.statusCode).toEqual(400)
    })

    test('users should be able to be referred', async () => {
      await prisma.user.update({
        where: {
          id: adminUser.id
        },
        data: {
          referralCode: '123456'
        }
      })

      const result = await app.inject({
        method: 'PUT',
        url: '/user/onboarding',
        headers: {
          'x-e2e-user-email': regularUser.email
        },
        payload: {
          referralCode: '123456'
        }
      })
      expect(result.statusCode).toEqual(200)

      const user = await prisma.user.findUnique({
        where: {
          email: regularUser.email
        }
      })
      expect(user.referredById).toEqual(adminUser.id)
    })

    test('should fail if referral code is not present', async () => {
      const result = await app.inject({
        method: 'PUT',
        url: '/user/onboarding',
        headers: {
          'x-e2e-user-email': regularUser.email
        },
        payload: {
          referralCode: '123456'
        }
      })
      expect(result.statusCode).toEqual(404)
    })
  })

  test('admin should be able to update themselves', async () => {
    const result = await app.inject({
      method: 'PUT',
      url: '/user',
      headers: {
        'x-e2e-user-email': adminUser.email
      },
      payload: {
        name: 'Admin Doe'
      }
    })
    expect(result.statusCode).toEqual(200)
    expect(JSON.parse(result.body).name).toEqual('Admin Doe')

    adminUser = JSON.parse(result.body)
  })

  it('should fail if duplicate user is created', async () => {
    const result = await app.inject({
      method: 'POST',
      url: '/user',
      headers: {
        'x-e2e-user-email': adminUser.email
      },
      payload: {
        email: regularUser.email.toUpperCase(),
        name: regularUser.name,
        isAdmin: false,
        isActive: true,
        isOnboardingFinished: true
      }
    })
    expect(result.statusCode).toEqual(409)
  })

  test('admin should be able to get any user by id', async () => {
    const result = await app.inject({
      method: 'GET',
      url: `/user/${regularUser.id}`,
      headers: {
        'x-e2e-user-email': adminUser.email
      }
    })
    expect(result.statusCode).toEqual(200)
  })

  test('admin should be able to fetch all users', async () => {
    const result = await app.inject({
      method: 'GET',
      url: `/user/all`,
      headers: {
        'x-e2e-user-email': adminUser.email
      }
    })
    expect(result.statusCode).toEqual(200)
    expect(JSON.parse(result.body).length).toEqual(2)
  })

  test('admin should be able to update any user', async () => {
    const result = await app.inject({
      method: 'PUT',
      url: `/user/${regularUser.id}`,
      headers: {
        'x-e2e-user-email': adminUser.email
      },
      payload: {
        name: 'John Doe',
        isOnboardingFinished: true
      }
    })
    expect(result.statusCode).toEqual(200)
    expect(JSON.parse(result.body).name).toEqual('John Doe')
    expect(JSON.parse(result.body).isOnboardingFinished).toEqual(true)
  })

  test('admin should be able to create new users', async () => {
    const payload = {
      email: 'janedoe@keyshade.io',
      name: 'Jane Doe',
      isAdmin: false,
      isActive: true,
      isOnboardingFinished: true
    }

    const result = await app.inject({
      method: 'POST',
      url: `/user`,
      headers: {
        'x-e2e-user-email': adminUser.email
      },
      payload
    })
    expect(result.statusCode).toEqual(201)
  })

  test('admin should be able to delete any user', async () => {
    const result = await app.inject({
      method: 'DELETE',
      url: `/user/${regularUser.id}`,
      headers: {
        'x-e2e-user-email': adminUser.email
      }
    })
    expect(result.statusCode).toEqual(204)
  })

  it('should send otp when user changes email', async () => {
    const result = await app.inject({
      method: 'PUT',
      url: `/user`,
      headers: {
        'x-e2e-user-email': regularUser.email
      },
      payload: {
        email: 'newEmail@keyshade.io'
      }
    })

    expect(result.statusCode).toEqual(200)

    const userEmailChange = await prisma.otp.findMany({
      where: {
        userId: regularUser.id,
        AND: {
          emailChange: {
            newEmail: 'newemail@keyshade.io'
          }
        }
      }
    })

    expect(userEmailChange.length).toEqual(1)
  })

  it('should allow admin to change an user email', async () => {
    const result = await app.inject({
      method: 'PUT',
      url: `/user/${regularUser.id}`,
      headers: {
        'x-e2e-user-email': adminUser.email
      },
      payload: {
        email: 'newEmail@keyshade.io'
      }
    })

    expect(result.statusCode).toEqual(200)
    expect(JSON.parse(result.body).email).toEqual('newemail@keyshade.io')

    const updatedUser = await prisma.user.findUnique({
      where: {
        id: regularUser.id
      }
    })

    expect(updatedUser.email).toEqual('newemail@keyshade.io')
  })

  it('should give error when new email is used by an existing user', async () => {
    const result = await app.inject({
      method: 'PUT',
      url: `/user`,
      headers: {
        'x-e2e-user-email': regularUser.email
      },
      payload: {
        email: 'john@keyshade.io'
      }
    })

    expect(result.statusCode).toEqual(409)
  })

  it('should validate OTP successfully', async () => {
    await prisma.otp.create({
      data: {
        code: '123456',
        userId: regularUser.id,
        expiresAt: new Date(new Date().getTime() + 5 * 60 * 1000),
        emailChange: {
          create: {
            newEmail: 'newjohn@keyshade.io'
          }
        }
      }
    })

    const result = await app.inject({
      method: 'POST',
      url: `/user/validate-email-change-otp`,
      query: {
        otp: '123456'
      },
      headers: {
        'x-e2e-user-email': regularUser.email
      }
    })

    expect(result.statusCode).toEqual(201)
    expect(JSON.parse(result.body).email).toEqual('newjohn@keyshade.io')

    const updatedUser = await prisma.user.findUnique({
      where: {
        id: regularUser.id
      }
    })

    expect(updatedUser.email).toEqual('newjohn@keyshade.io')
  })

  it('should fail to validate expired or invalid OTP', async () => {
    await prisma.otp.create({
      data: {
        code: '123456',
        userId: regularUser.id,
        expiresAt: new Date(new Date().getTime() - 1),
        emailChange: {
          create: {
            newEmail: 'newjohn@keyshade.io'
          }
        }
      }
    })

    const result = await app.inject({
      method: 'POST',
      url: `/user/validate-email-change-otp`,
      query: {
        otp: '123456'
      },
      headers: {
        'x-e2e-user-email': regularUser.email
      }
    })

    expect(result.statusCode).toEqual(401)

    const nonUpdatedUser = await prisma.user.findUnique({
      where: {
        id: regularUser.id
      }
    })

    expect(nonUpdatedUser.email).toEqual('john@keyshade.io')
  })

  it('should resend OTP successfully', async () => {
    await prisma.otp.create({
      data: {
        code: '123456',
        userId: regularUser.id,
        expiresAt: new Date(new Date().getTime() + 5 * 60 * 1000),
        emailChange: {
          create: {
            newEmail: 'newjohn@keyshade.io'
          }
        }
      }
    })

    const result = await app.inject({
      method: 'POST',
      url: `/user/resend-email-change-otp`,
      headers: {
        'x-e2e-user-email': regularUser.email
      }
    })

    expect(result.statusCode).toEqual(201)

    const updatedOtp = await prisma.otp.findUnique({
      where: {
        userId: regularUser.id,
        emailChange: {
          newEmail: 'newjohn@keyshade.io'
        }
      }
    })

    expect(updatedOtp.code).not.toEqual('123456')
  })

  it('should return 409 Conflict if the email already exists', async () => {
    const result = await app.inject({
      method: 'PUT',
      url: `/user/${regularUser.id}`,
      headers: {
        'x-e2e-user-email': adminUser.email
      },
      payload: {
        email: adminUser.email // existing email
      }
    })

    expect(result.statusCode).toEqual(409)
  })

  it('should return 409 Conflict if no previous OTP exists for email change', async () => {
    const result = await app.inject({
      method: 'POST',
      url: `/user/resend-email-change-otp`,
      headers: {
        'x-e2e-user-email': regularUser.email
      }
    })

    expect(result.statusCode).toEqual(409)
  })

  // test('user should be able to delete their own account', async () => {
  //   const result = await app.inject({
  //     method: 'DELETE',
  //     url: `/user`,
  //     headers: {
  //       'x-e2e-user-email': regularUser.email
  //     }
  //   })
  //   expect(result.statusCode).toEqual(204)
  // })

  // it('should delete the default workspace on user deletion', async () => {
  //   // Delete the user
  //   await userService.deleteUser(regularUser.id)

  //   // Try fetching the workspace related to the user
  //   const workspace = await prisma.workspace.findFirst({
  //     where: {
  //       ownerId: regularUser.id,
  //       isDefault: true
  //     }
  //   })

  //   expect(workspace).toBeNull()
  // })

  afterAll(async () => {
    await prisma.$disconnect()
    await app.close()
  })
})
