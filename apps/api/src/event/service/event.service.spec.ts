import { Test, TestingModule } from '@nestjs/testing'
import { EventService } from './event.service'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { CommonModule } from '@/common/common.module'
import { AuthorityCheckerService } from '@/auth/service/authority-checker.service'

describe('EventService', () => {
  let service: EventService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      providers: [
        EventService,
        PrismaService,
        AuthorizationService,
        AuthorityCheckerService
      ]
    }).compile()

    service = module.get<EventService>(EventService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
