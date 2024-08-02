import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from '../service/auth.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'
import { AuthController } from './auth.controller'
import { mockDeep } from 'jest-mock-extended'
import { ConfigService } from '@nestjs/config'
import { GithubOAuthStrategyFactory } from '../../config/factory/github/github-strategy.factory'
import { GoogleOAuthStrategyFactory } from '../../config/factory/google/google-strategy.factory'
import { GitlabOAuthStrategyFactory } from '../../config/factory/gitlab/gitlab-strategy.factory'
import { CacheService } from '../../cache/cache.service'
import { REDIS_CLIENT } from '../../provider/redis.provider'

describe('AuthController', () => {
  let controller: AuthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        GithubOAuthStrategyFactory,
        GoogleOAuthStrategyFactory,
        GitlabOAuthStrategyFactory,
        ConfigService,
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

    controller = module.get<AuthController>(AuthController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
