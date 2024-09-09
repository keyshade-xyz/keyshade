import { Test, TestingModule } from '@nestjs/testing'
import { UserController } from './user.controller'
import { UserService } from '../service/user.service'
import { PrismaService } from '@/prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
import { CacheService } from '@/cache/cache.service'
import { REDIS_CLIENT } from '@/provider/redis.provider'

describe('UserController', () => {
  let controller: UserController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        PrismaService,
        { provide: MAIL_SERVICE, useValue: MockMailService },
        { provide: REDIS_CLIENT, useValue: null },
        CacheService
      ]
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile()

    controller = module.get<UserController>(UserController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
