import { Test, TestingModule } from '@nestjs/testing'
import { EnvironmentController } from './environment.controller'
import { EnvironmentService } from '../service/environment.service'
import { PrismaService } from '../../prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'
import { AuthorityCheckerService } from '../../common/authority-checker.service'
import { LoggerModule } from '../../logger/logger.module'

describe('EnvironmentController', () => {
  let controller: EnvironmentController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      controllers: [EnvironmentController],
      providers: [EnvironmentService, PrismaService, AuthorityCheckerService]
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile()

    controller = module.get<EnvironmentController>(EnvironmentController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
