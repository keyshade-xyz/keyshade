import { Test, TestingModule } from '@nestjs/testing'
import { WorkspaceRoleController } from './workspace-role.controller'
import { PrismaService } from '@/prisma/prisma.service'
import { WorkspaceRoleService } from '../service/workspace-role.service'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { AuthorityCheckerService } from '@/auth/service/authority-checker.service'
import { CommonModule } from '@/common/common.module'

describe('WorkspaceRoleController', () => {
  let controller: WorkspaceRoleController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      providers: [
        WorkspaceRoleService,
        PrismaService,
        AuthorizationService,
        AuthorityCheckerService
      ],
      controllers: [WorkspaceRoleController]
    }).compile()

    controller = module.get<WorkspaceRoleController>(WorkspaceRoleController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
