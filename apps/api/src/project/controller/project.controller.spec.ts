import { Test, TestingModule } from '@nestjs/testing'
import { ProjectController } from './project.controller'
import { ProjectService } from '../service/project.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { PrismaService } from '../../prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'
import { AuthorityCheckerService } from '../../common/authority-checker.service'

describe('ProjectController', () => {
  let controller: ProjectController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
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

    controller = module.get<ProjectController>(ProjectController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
