import { Test, TestingModule } from '@nestjs/testing'
import { VariableController } from './variable.controller'
import { PrismaService } from '../../prisma/prisma.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { VariableService } from '../service/variable.service'
import { REDIS_CLIENT } from '../../provider/redis.provider'
import { RedisClientType } from 'redis'
import { mockDeep } from 'jest-mock-extended'
import { ProviderModule } from '../../provider/provider.module'

describe('VariableController', () => {
  let controller: VariableController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ProviderModule],
      providers: [
        PrismaService,
        {
          provide: MAIL_SERVICE,
          useClass: MockMailService
        },
        VariableService
      ],
      controllers: [VariableController]
    })
      .overrideProvider(REDIS_CLIENT)
      .useValue(mockDeep<RedisClientType>())
      .compile()

    controller = module.get<VariableController>(VariableController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
