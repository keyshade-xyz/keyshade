import { Test, TestingModule } from '@nestjs/testing'
import { WorkspaceRoleService } from './workspace-role.service'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { AuthorityCheckerService } from '@/auth/service/authority-checker.service'
import { CommonModule } from '@/common/common.module'

describe('WorkspaceRoleService', () => {
  let service: WorkspaceRoleService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      providers: [
        WorkspaceRoleService,
        PrismaService,
        AuthorizationService,
        AuthorityCheckerService
      ]
    }).compile()

    service = module.get<WorkspaceRoleService>(WorkspaceRoleService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
