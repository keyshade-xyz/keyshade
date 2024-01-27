import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import { PrismaService } from '../../prisma/prisma.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { users } from '../../common/mock-data/users'

const mockPrisma = {
  workspace: {
    create: jest.fn(),
    delete: jest.fn()
  },
  user: {
    count: jest.fn().mockImplementation(
      (args: {
        where: {
          email: string
        }
      }) => {
        const filtered = users.filter((u) => {
          return u.email.includes(args.where.email)
        })
        return filtered.length
      }
    ),
    findUnique: jest.fn().mockImplementation((args) => {
      const user = users.find((u) => u.id === args.where.id)
      if (!user) {
        throw new Error('User not found')
      }
      return user
    }),
    findMany: jest.fn().mockImplementation(() => users),
    delete: jest.fn().mockImplementation((args) => {
      const user = users.find((u) => u.id === args.where.id)
      if (!user) {
        throw new Error('User not found')
      }
      return user
    }),
    create: jest.fn().mockImplementation((args) => {
      return {
        id: '5',
        name: args.data.name,
        email: args.data.email,
        profilePictureUrl: args.data.profilePictureUrl,
        isActive: args.data.isActive,
        isOnboardingFinished: args.data.isOnboardingFinished,
        isAdmin: args.data.isAdmin
      }
    }),
    update: jest.fn().mockImplementation((args) => {
      const user = users[0]
      return {
        ...user,
        name: args.data.name ?? user.name,
        profilePictureUrl:
          args.data.profilePictureUrl ?? user.profilePictureUrl,
        isOnboardingFinished:
          args.data.isOnboardingFinished ?? user.isOnboardingFinished,
        email: args.data.email ?? user.email,
        id: args.data.id ?? user.id,
        isActive: args.data.isActive ?? user.isActive,
        isAdmin: args.data.isAdmin ?? user.isAdmin
      }
    })
  }
}

describe('UserService', () => {
  let service: UserService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        PrismaService,
        { provide: MAIL_SERVICE, useClass: MockMailService }
      ]
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile()

    service = module.get<UserService>(UserService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should exclude the isActive field from the user object', async () => {
    const user = users[0]
    const result = await service.getSelf(user)
    expect(result).not.toHaveProperty('isActive')
    expect(result).toEqual({
      ...user,
      isActive: undefined
    })
  })

  it('should be able to update the allowed fields', async () => {
    const user = users[0]
    const dto = {
      name: 'Jane Doe',
      profilePictureUrl: 'https://keyshade.xyz/janedoe.jpg'
    }
    const result = await service.updateSelf(user, dto, true)
    expect(result).toEqual({
      ...user,
      name: 'Jane Doe',
      isActive: undefined,
      profilePictureUrl: 'https://keyshade.xyz/janedoe.jpg',
      isOnboardingFinished: true
    })
  })

  it('should be able to update the current user onboarding status', async () => {
    const user = users[0]
    const result = await service.updateSelf(user, null, true)
    expect(result).toEqual({
      ...user,
      isOnboardingFinished: true,
      isActive: undefined
    })
  })

  it('should not be able to update the restricted fields', async () => {
    const user = users[0]
    const dto = {
      isActive: false,
      isAdmin: true,
      email: 'this-fails@keyshade.xyz',
      id: 'this-fails-too'
    }
    const result = await service.updateSelf(user, dto, false)
    expect(result).toEqual({
      ...user,
      isActive: undefined,
      isAdmin: false
    })
  })

  it('admin should be able to update the restricted fields', async () => {
    const user = users[0]
    const dto = {
      isActive: false,
      isAdmin: true,
      profilePictureUrl: 'https://keyshade.xyz/johndoe.jpg',
      isOnboardingFinished: true
    }
    const result = await service.updateUser(user.id, dto, true)
    expect(result).toEqual({
      ...user,
      ...dto
    })
  })

  it('admin can create new user', async () => {
    const dto = {
      name: 'Jane Doe',
      email: 'janeDoe@keyshade.xyz',
      profilePictureUrl: 'https://keyshade.xyz/janedoe.jpg',
      isActive: true,
      isOnboardingFinished: false,
      isAdmin: false
    }
    const result = await service.createUser(dto)
    expect(result).toEqual({
      ...dto,
      id: '5'
    })
  })

  it('can fetch user by their id', async () => {
    const user = users[0]
    const result = await service.getUserById(user.id)
    expect(result).toEqual(user)
  })

  it('can fetch all users', async () => {
    const result = await service.getAllUsers(0, 3, 'name', 'asc', '')
    expect(result).toEqual(users)
  })

  it('can delete a user', async () => {
    const user = users[0]
    const result = await service.deleteUser(user.id)
    expect(result).toBeUndefined()
  })

  it('can delete self', async () => {
    const user = users[0]
    const result = await service.deleteSelf(user)
    expect(result).toBeUndefined()
  })
})
