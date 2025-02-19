import { Test, TestingModule } from '@nestjs/testing'
import { EventController } from './event.controller'
import { EventService } from '../service/event.service'
import { PrismaService } from '@/prisma/prisma.service'
import { CommonModule } from '@/common/common.module'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { AuthorityCheckerService } from '@/auth/service/authority-checker.service'

describe('EventController', () => {
  let controller: EventController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      controllers: [EventController],
      providers: [
        EventService,
        PrismaService,
        AuthorizationService,
        AuthorityCheckerService
      ]
    }).compile()

    controller = module.get<EventController>(EventController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
