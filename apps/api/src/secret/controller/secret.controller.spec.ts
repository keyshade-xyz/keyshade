import { Test, TestingModule } from '@nestjs/testing'
import { SecretController } from './secret.controller'
import { SecretService } from '../service/secret.service'
import { PrismaService } from '@/prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { RedisClientType } from 'redis'
import { ProviderModule } from '@/provider/provider.module'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { AuthorityCheckerService } from '@/auth/service/authority-checker.service'
import { CommonModule } from '@/common/common.module'

describe('SecretController', () => {
  let controller: SecretController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ProviderModule, CommonModule],
      controllers: [SecretController],
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

    controller = module.get<SecretController>(SecretController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
