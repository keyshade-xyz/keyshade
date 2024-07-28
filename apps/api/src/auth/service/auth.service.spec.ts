import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { MockMailService } from '../../mail/services/mock.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'
import { CacheService } from '../../cache/cache.service'

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: MAIL_SERVICE, useClass: MockMailService },
        JwtService,
        PrismaService,
        CacheService
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
