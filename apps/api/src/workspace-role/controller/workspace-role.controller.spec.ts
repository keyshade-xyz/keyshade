import { Test, TestingModule } from '@nestjs/testing'
import { WorkspaceRoleController } from './workspace-role.controller'
import { MockMailService } from '../../mail/services/mock.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { PrismaService } from '../../prisma/prisma.service'
import { WorkspaceRoleService } from '../service/workspace-role.service'

describe('WorkspaceRoleController', () => {
  let controller: WorkspaceRoleController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceRoleService,
        PrismaService,
        { provide: MAIL_SERVICE, useClass: MockMailService }
      ],
      controllers: [WorkspaceRoleController]
    }).compile()

    controller = module.get<WorkspaceRoleController>(WorkspaceRoleController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
