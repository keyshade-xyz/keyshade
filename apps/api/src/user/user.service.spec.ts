import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import { fakeRepository } from './fake.repository'
import { User } from '@prisma/client'
import { users } from '../mock-data/users'

describe('UserService', () => {
  let service: UserService

  const user: User = {
    id: '1',
    name: 'John Doe',
    email: 'johndoe@keyshade.xyz',
    profilePictureUrl: 'https://keyshade.xyz/johndoe.jpg',
    isActive: true,
    isOnboardingFinished: false,
    isAdmin: false
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'PrismaRepository',
          useValue: fakeRepository
        }
      ]
    }).compile()

    service = module.get<UserService>(UserService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('should be able to get current user', () => {
    it('should exclude the isActive field from the user object', async () => {
      const result = await service.getSelf(user)
      expect(result).not.toHaveProperty('isActive')
      expect(result).toEqual({
        ...user,
        isActive: undefined
      })
    })
  })

  describe('should  get all  user', () => {
    const page = 1
    const limit = 10
    const sort = 'name'
    const order = 'asc'
    const search = ''

    const sorted_user_data: Array<User> = users.sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    it('should return all users in ascending order on name key  from the repository', async () => {
      const result = await service.getAllUsers(page, limit, sort, order, search)
      expect(result).toEqual(sorted_user_data)
    })

    it('should return 2 users as limit is 2', async () => {
      const result = await service.getAllUsers(page, 2, sort, order, search)
      expect(result).toEqual(sorted_user_data.slice(0, 2))
    })

    it('should return  users with name as "Jocelyn Larkin ', async () => {
      const result = await service.getAllUsers(
        page,
        limit,
        sort,
        order,
        'Jocelyn Larkin'
      )
      expect(result).toEqual(
        sorted_user_data.filter((user) => user.name === 'Jocelyn Larkin')
      )
    })
  })

  describe('should be able to get current user', () => {
    it('should exclude the isActive field from the user object', async () => {
      const result = await service.getSelf(user)
      expect(result).not.toHaveProperty('isActive')
      expect(result).toEqual({
        ...user,
        isActive: undefined
      })
    })
  })

  describe('should be able to update the current user name', () => {
    it('should update the user with the given data', async () => {
      const dto = { name: 'Jane Doe' }
      const result = await service.updateSelf(user, dto, false)
      expect(result).toEqual({
        ...user,
        name: 'Jane Doe',
        isActive: undefined
      })
    })
  })

  describe('should be able to update the current user onboarding status', () => {
    it('should update the user with the given data', async () => {
      const result = await service.updateSelf(user, null, true)
      expect(result).toEqual({
        ...user,
        isOnboardingFinished: true,
        isActive: undefined
      })
    })
  })
})
