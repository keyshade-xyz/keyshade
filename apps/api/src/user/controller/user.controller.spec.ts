import { Test, TestingModule } from '@nestjs/testing'
import { UserController } from './user.controller'
import { UserService } from '../service/user.service'
import { User } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'

describe('UserController', () => {
  let controller: UserController
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
      controllers: [UserController],
      providers: [UserService, PrismaService]
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile()

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
})
