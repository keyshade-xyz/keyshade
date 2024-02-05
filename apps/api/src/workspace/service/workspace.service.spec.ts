import { Test, TestingModule } from '@nestjs/testing'
import { WorkspaceService } from './workspace.service'
import { PrismaService } from '../../prisma/prisma.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { JwtService } from '@nestjs/jwt'

describe('WorkspaceService', () => {
  let service: WorkspaceService

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
      ]
    }).compile()

    service = module.get<WorkspaceService>(WorkspaceService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
