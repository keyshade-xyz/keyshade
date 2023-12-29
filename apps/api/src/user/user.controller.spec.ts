import { Test, TestingModule } from '@nestjs/testing'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { fakeRepository } from './fake.repository'
import { User } from '@prisma/client'
import { users } from '../common/mock-data/users'

describe('UserController', () => {
  let controller: UserController
  let service: UserService

  const user: User = users[0]

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: 'PrismaRepository',
          useValue: fakeRepository
        }
      ]
    }).compile()

    controller = module.get<UserController>(UserController)
    service = module.get<UserService>(UserService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('should return the current user', () => {
    it('should return the current user', async () => {
      jest.spyOn(service, 'getSelf').mockResolvedValue(user)
      expect(await controller.getCurrentUser(user)).toEqual(user)
    })
  })

  describe('should update the current user', () => {
    it('should update the current user', async () => {
      const dto = { name: 'Jane Doe' }
      const finishOnboarding = false
      jest.spyOn(service, 'updateSelf').mockResolvedValue(user)
      expect(await controller.updateSelf(user, dto, finishOnboarding)).toEqual(
        user
      )
    })
  })

  describe('should update the user with the given id', () => {
    it('should update the user with the given ID', async () => {
      const userId = '1'
      const dto = { name: 'Jane Doe' }
      const finishOnboarding = false
      jest.spyOn(service, 'updateUser').mockResolvedValue(user)
      expect(
        await controller.updateUser(userId, dto, finishOnboarding)
      ).toEqual(user)
    })
  })

  describe('should fail to update the user with the given id', () => {
    it('should fail to update the user with the given ID', async () => {
      const userId = '2'
      const dto = { name: 'Jane Doe' }
      const finishOnboarding = false
      jest.spyOn(service, 'updateUser').mockResolvedValue(null)
      expect(
        await controller.updateUser(userId, dto, finishOnboarding)
      ).toEqual(null)
    })
  })

  describe('should return the user with the given id', () => {
    it('should return the user with the given ID', async () => {
      const userId = '1'
      jest.spyOn(service, 'getUserById').mockResolvedValue(user)
      expect(await controller.getUserById(userId)).toEqual(user)
    })
  })

  describe('should fail to return the user with the given id', () => {
    it('should fail to return the user with the given ID', async () => {
      const userId = '2'
      jest.spyOn(service, 'getUserById').mockResolvedValue(null)
      expect(await controller.getUserById(userId)).toEqual(null)
    })
  })

  describe('get all users', () => {
    const sorted_user_data: Array<User> = users.sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    it('should return all users with default parameters', async () => {
      jest.spyOn(service, 'getAllUsers').mockResolvedValue(users)
      expect(await controller.getAllUsers()).toEqual(users)
    })

    it('should return only 2 users with a limit of 2', async () => {
      jest.spyOn(service, 'getAllUsers').mockResolvedValue(users.slice(0, 2))
      expect(await controller.getAllUsers(1, 2)).toEqual(users.slice(0, 2))
    })

    it('should return users sorted by name in ascending order', async () => {
      jest.spyOn(service, 'getAllUsers').mockResolvedValue(sorted_user_data)
      expect(
        await controller.getAllUsers(undefined, undefined, 'name', 'asc')
      ).toEqual(sorted_user_data)
    })

    const filtered_user_data: Array<User> = users.filter(
      (user) => user.name === 'John Doe'
    )
    it('should return users, where name is "John Doe"', async () => {
      jest.spyOn(service, 'getAllUsers').mockResolvedValue(filtered_user_data)
      expect(
        await controller.getAllUsers(
          undefined,
          undefined,
          undefined,
          undefined,
          'Jon Doe'
        )
      ).toEqual(filtered_user_data)
    })
  })
})
