import { Test, TestingModule } from '@nestjs/testing'
import { ProjectService } from './project.service'
import { MockMailService } from '../../mail/services/mock.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { PrismaService } from '../../prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'
import { AuthorityCheckerService } from '../../common/authority-checker.service'
import { LoggerModule } from '../../logger/logger.module'

describe('ProjectService', () => {
  let service: ProjectService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        ProjectService,
        PrismaService,
        { provide: MAIL_SERVICE, useClass: MockMailService },
        AuthorityCheckerService
      ]
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile()

    service = module.get<ProjectService>(ProjectService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
