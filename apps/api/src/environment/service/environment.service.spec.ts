import { Test, TestingModule } from '@nestjs/testing'
import { EnvironmentService } from './environment.service'
import { PrismaService } from '../../prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'
import { AuthorityCheckerService } from '../../common/authority-checker.service'
import { LoggerModule } from '../../logger/logger.module'

describe('EnvironmentService', () => {
  let service: EnvironmentService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [EnvironmentService, PrismaService, AuthorityCheckerService]
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile()

    service = module.get<EnvironmentService>(EnvironmentService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
