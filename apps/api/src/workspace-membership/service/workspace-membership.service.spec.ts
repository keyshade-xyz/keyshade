import { Test, TestingModule } from '@nestjs/testing'
import { WorkspaceMembershipService } from './workspace-membership.service'
import { PrismaService } from '@/prisma/prisma.service'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
import { JwtService } from '@nestjs/jwt'
import { AuthorityCheckerService } from '@/common/authority-checker.service'
import { CommonModule } from '@/common/common.module'

describe('WorkspaceMembershipService', () => {
  let service: WorkspaceMembershipService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      providers: [
        WorkspaceMembershipService,
        PrismaService,
        {
          provide: MAIL_SERVICE,
          useClass: MockMailService
        },
        JwtService,
        AuthorityCheckerService
      ]
    }).compile()

    service = module.get<WorkspaceMembershipService>(WorkspaceMembershipService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
