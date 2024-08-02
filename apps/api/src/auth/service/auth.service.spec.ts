import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { MockMailService } from '../../mail/services/mock.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'
import { CacheService } from '../../cache/cache.service'
import { REDIS_CLIENT } from '../../provider/redis.provider'

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: MAIL_SERVICE, useClass: MockMailService },
        JwtService,
        PrismaService,
        CacheService,
        {
          provide: REDIS_CLIENT,
          useValue: {
            publisher: {
              setEx: jest.fn(),
              set: jest.fn(),
              get: jest.fn(),
              del: jest.fn(),
              keys: jest.fn()
            }
          }
        }
      ]
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
