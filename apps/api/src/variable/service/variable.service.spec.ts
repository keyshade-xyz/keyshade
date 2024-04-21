import { Test, TestingModule } from '@nestjs/testing'
import { VariableService } from './variable.service'
import { PrismaService } from '../../prisma/prisma.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { REDIS_CLIENT } from '../../provider/redis.provider'
import { RedisClientType } from 'redis'
import { mockDeep } from 'jest-mock-extended'
import { ProviderModule } from '../../provider/provider.module'
import { AuthorityCheckerService } from '../../common/authority-checker.service'
import { LoggerModule } from '../../logger/logger.module'

describe('VariableService', () => {
  let service: VariableService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ProviderModule, LoggerModule],
      providers: [
        PrismaService,
        {
          provide: MAIL_SERVICE,
          useClass: MockMailService
        },
        VariableService,
        AuthorityCheckerService
      ]
    })
      .overrideProvider(REDIS_CLIENT)
      .useValue(mockDeep<RedisClientType>())
      .compile()

    service = module.get<VariableService>(VariableService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
