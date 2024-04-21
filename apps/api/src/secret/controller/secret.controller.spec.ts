import { Test, TestingModule } from '@nestjs/testing'
import { SecretController } from './secret.controller'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { SecretService } from '../service/secret.service'
import { PrismaService } from '../../prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'
import { REDIS_CLIENT } from '../../provider/redis.provider'
import { RedisClientType } from 'redis'
import { ProviderModule } from '../../provider/provider.module'
import { AuthorityCheckerService } from '../../common/authority-checker.service'
import { LoggerModule } from '../../logger/logger.module'

describe('SecretController', () => {
  let controller: SecretController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ProviderModule, LoggerModule],
      controllers: [SecretController],
      providers: [
        PrismaService,
        {
          provide: MAIL_SERVICE,
          useClass: MockMailService
        },
        SecretService,
        AuthorityCheckerService
      ]
    })
      .overrideProvider(REDIS_CLIENT)
      .useValue(mockDeep<RedisClientType>())
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile()

    controller = module.get<SecretController>(SecretController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
