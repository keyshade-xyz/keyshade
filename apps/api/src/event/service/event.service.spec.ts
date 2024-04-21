import { Test, TestingModule } from '@nestjs/testing'
import { EventService } from './event.service'
import { PrismaService } from '../../prisma/prisma.service'
import { AuthorityCheckerService } from '../../common/authority-checker.service'

describe('EventService', () => {
  let service: EventService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventService, PrismaService, AuthorityCheckerService]
    }).compile()

    service = module.get<EventService>(EventService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
