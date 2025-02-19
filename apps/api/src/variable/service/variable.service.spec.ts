import { Test, TestingModule } from '@nestjs/testing'
import { VariableService } from './variable.service'
import { PrismaService } from '@/prisma/prisma.service'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { RedisClientType } from 'redis'
import { mockDeep } from 'jest-mock-extended'
import { ProviderModule } from '@/provider/provider.module'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { AuthorityCheckerService } from '@/auth/service/authority-checker.service'
import { CommonModule } from '@/common/common.module'

describe('VariableService', () => {
  let service: VariableService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ProviderModule, CommonModule],
      providers: [
        PrismaService,
        VariableService,
        AuthorizationService,
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
