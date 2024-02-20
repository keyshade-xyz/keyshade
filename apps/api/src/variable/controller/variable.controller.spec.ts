import { Test, TestingModule } from '@nestjs/testing'
import { VariableController } from './variable.controller'
import { PrismaService } from '../../prisma/prisma.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { VariableService } from '../service/variable.service'

describe('VariableController', () => {
  let controller: VariableController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: MAIL_SERVICE,
          useClass: MockMailService
        },
        VariableService
      ],
      controllers: [VariableController]
    }).compile()

    controller = module.get<VariableController>(VariableController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
