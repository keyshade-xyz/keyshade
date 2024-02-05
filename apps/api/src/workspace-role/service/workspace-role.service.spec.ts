import { Test, TestingModule } from '@nestjs/testing'
import { WorkspaceRoleService } from './workspace-role.service'
import { PrismaService } from '../../prisma/prisma.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'

describe('WorkspaceRoleService', () => {
  let service: WorkspaceRoleService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceRoleService,
        PrismaService,
        { provide: MAIL_SERVICE, useClass: MockMailService }
      ]
    }).compile()

    service = module.get<WorkspaceRoleService>(WorkspaceRoleService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
