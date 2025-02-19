import { Test, TestingModule } from '@nestjs/testing'
import { IntegrationService } from './integration.service'
import { CommonModule } from '@/common/common.module'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { mockDeep } from 'jest-mock-extended'
import { AuthorityCheckerService } from '@/auth/service/authority-checker.service'

describe('IntegrationService', () => {
  let service: IntegrationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      providers: [
        PrismaService,
        AuthorizationService,
        AuthorityCheckerService,
        IntegrationService
      ]
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile()

    service = module.get<IntegrationService>(IntegrationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
