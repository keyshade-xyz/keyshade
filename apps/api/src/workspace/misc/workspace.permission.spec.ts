import { Test, TestingModule } from '@nestjs/testing'
import { WorkspacePermission } from './workspace.permission'
import { PrismaService } from '../../prisma/prisma.service'

describe('WorkspacePermission', () => {
  let service: WorkspacePermission

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkspacePermission, PrismaService]
    }).compile()

    service = module.get<WorkspacePermission>(WorkspacePermission)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
