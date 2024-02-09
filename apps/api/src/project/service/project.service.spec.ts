import { Test, TestingModule } from '@nestjs/testing'
import { ProjectService } from './project.service'
import { MockMailService } from '../../mail/services/mock.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { PrismaService } from '../../prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'

describe('ProjectService', () => {
  let service: ProjectService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        PrismaService,
        { provide: MAIL_SERVICE, useClass: MockMailService }
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
