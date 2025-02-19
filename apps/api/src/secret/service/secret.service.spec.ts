import { Test, TestingModule } from '@nestjs/testing'
import { SecretService } from './secret.service'
import { PrismaService } from '@/prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { RedisClientType } from 'redis'
import { ProviderModule } from '@/provider/provider.module'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { AuthorityCheckerService } from '@/auth/service/authority-checker.service'
import { CommonModule } from '@/common/common.module'

describe('SecretService', () => {
  let service: SecretService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ProviderModule, CommonModule],
      providers: [
        PrismaService,
        SecretService,
        AuthorizationService,
        AuthorityCheckerService
      ]
    })
      .overrideProvider(REDIS_CLIENT)
      .useValue(mockDeep<RedisClientType>())
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile()

    service = module.get<SecretService>(SecretService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
