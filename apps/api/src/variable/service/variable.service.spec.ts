import { Test, TestingModule } from '@nestjs/testing'
import { VariableService } from './variable.service'
import { PrismaService } from '../../prisma/prisma.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'

describe('VariableService', () => {
  let service: VariableService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: MAIL_SERVICE,
          useClass: MockMailService
        },
        VariableService
      ]
    }).compile()

    service = module.get<VariableService>(VariableService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
