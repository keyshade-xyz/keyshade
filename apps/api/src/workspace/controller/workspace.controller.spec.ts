import { Test, TestingModule } from '@nestjs/testing'
import { WorkspaceController } from './workspace.controller'
import { WorkspaceService } from '../service/workspace.service'
import { PrismaService } from '../../prisma/prisma.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { JwtService } from '@nestjs/jwt'

describe('WorkspaceController', () => {
  let controller: WorkspaceController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        PrismaService,
        {
          provide: MAIL_SERVICE,
          useClass: MockMailService
        },
        JwtService
      ],
      controllers: [WorkspaceController]
    }).compile()

    controller = module.get<WorkspaceController>(WorkspaceController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
