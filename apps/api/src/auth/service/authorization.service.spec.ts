import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthorizationService } from './authorization.service'
import { AuthorityCheckerService } from './authority-checker.service'
import { CommonModule } from '@/common/common.module'

describe('AuthorizationService', () => {
  let service: AuthorizationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      providers: [PrismaService, AuthorizationService, AuthorityCheckerService]
    }).compile()

    service = module.get<AuthorizationService>(AuthorizationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
