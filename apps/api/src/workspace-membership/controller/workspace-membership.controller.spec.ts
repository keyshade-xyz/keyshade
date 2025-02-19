import { Test, TestingModule } from '@nestjs/testing'
import { WorkspaceMembershipController } from './workspace-membership.controller'
import { WorkspaceMembershipService } from '../service/workspace-membership.service'
import { PrismaService } from '@/prisma/prisma.service'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'
import { JwtService } from '@nestjs/jwt'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { AuthorityCheckerService } from '@/auth/service/authority-checker.service'
import { CommonModule } from '@/common/common.module'

describe('WorkspaceMembershipController', () => {
  let controller: WorkspaceMembershipController

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
        AuthorizationService,
        AuthorityCheckerService
      ],
      controllers: [WorkspaceMembershipController]
    }).compile()

    controller = module.get<WorkspaceMembershipController>(
      WorkspaceMembershipController
    )
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
