import { Test, TestingModule } from '@nestjs/testing'
import { EventService } from './event.service'
import { PrismaService } from '../../prisma/prisma.service'
import { AuthorityCheckerService } from '../../common/authority-checker.service'
import { CommonModule } from '../../common/common.module'

describe('EventService', () => {
  let service: EventService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      providers: [EventService, PrismaService, AuthorityCheckerService]
    }).compile()

    service = module.get<EventService>(EventService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
