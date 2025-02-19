import { Test, TestingModule } from '@nestjs/testing'
import { EnvironmentService } from './environment.service'
import { PrismaService } from '@/prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'
import { CommonModule } from '@/common/common.module'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { AuthorityCheckerService } from '@/auth/service/authority-checker.service'

describe('EnvironmentService', () => {
  let service: EnvironmentService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      providers: [
        EnvironmentService,
        PrismaService,
        AuthorizationService,
        AuthorityCheckerService
      ]
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile()

    service = module.get<EnvironmentService>(EnvironmentService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
