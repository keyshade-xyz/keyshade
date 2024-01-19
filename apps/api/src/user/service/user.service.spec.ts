import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import { User } from '@prisma/client'
import { USER_REPOSITORY } from '../repository/interface.repository'
import { MockUserRepository } from '../repository/mock.repository'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'

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
        { provide: USER_REPOSITORY, useClass: MockUserRepository },
        { provide: MAIL_SERVICE, useValue: MockMailService }
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
