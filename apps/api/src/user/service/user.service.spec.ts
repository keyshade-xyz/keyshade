import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import { PrismaService } from '@/prisma/prisma.service'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
import { CacheService } from '@/cache/cache.service'
import { REDIS_CLIENT } from '@/provider/redis.provider'

describe('UserService', () => {
  let service: UserService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        PrismaService,
        CacheService,
        { provide: MAIL_SERVICE, useClass: MockMailService },
        { provide: REDIS_CLIENT, useValue: null }
      ]
    }).compile()

    service = module.get<UserService>(UserService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
