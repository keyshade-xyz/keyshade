import { Test, TestingModule } from '@nestjs/testing'
import { ApprovalController } from './approval.controller'
import { PrismaService } from '../../prisma/prisma.service'
import { WorkspaceService } from '../../workspace/service/workspace.service'
import { ProjectService } from '../../project/service/project.service'
import { EnvironmentService } from '../../environment/service/environment.service'
import { VariableService } from '../../variable/service/variable.service'
import { SecretService } from '../../secret/service/secret.service'
import { ApprovalService } from '../service/approval.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { JwtService } from '@nestjs/jwt'

describe('ApprovalController', () => {
  let controller: ApprovalController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApprovalController],
      providers: [
        ApprovalService,
        PrismaService,
        WorkspaceService,
        ProjectService,
        EnvironmentService,
        VariableService,
        SecretService,
        JwtService,
        {
          provide: MAIL_SERVICE,
          useClass: MockMailService
        }
      ]
    }).compile()

    controller = module.get<ApprovalController>(ApprovalController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
