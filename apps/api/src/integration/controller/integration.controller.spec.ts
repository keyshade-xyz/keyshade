import { Test, TestingModule } from '@nestjs/testing'
import { IntegrationController } from './integration.controller'
import { PrismaService } from '@/prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { IntegrationService } from '../service/integration.service'
import { CommonModule } from '@/common/common.module'
import { AuthorityCheckerService } from '@/auth/service/authority-checker.service'

describe('IntegrationController', () => {
  let controller: IntegrationController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      controllers: [IntegrationController],
      providers: [
        PrismaService,
        AuthorizationService,
        AuthorityCheckerService,
        IntegrationService
      ]
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile()

    controller = module.get<IntegrationController>(IntegrationController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
