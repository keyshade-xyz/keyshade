import { Test, TestingModule } from '@nestjs/testing'
import { WorkspaceRoleService } from './workspace-role.service'
import { PrismaService } from '../../prisma/prisma.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { AuthorityCheckerService } from '../../common/authority-checker.service'
import { LoggerModule } from '../../logger/logger.module'

describe('WorkspaceRoleService', () => {
  let service: WorkspaceRoleService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        WorkspaceRoleService,
        PrismaService,
        { provide: MAIL_SERVICE, useClass: MockMailService },
        AuthorityCheckerService
      ]
    }).compile()

    service = module.get<WorkspaceRoleService>(WorkspaceRoleService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
