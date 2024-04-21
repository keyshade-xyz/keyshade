import { Test, TestingModule } from '@nestjs/testing'
import { EventController } from './event.controller'
import { EventService } from '../service/event.service'
import { PrismaService } from '../../prisma/prisma.service'
import { AuthorityCheckerService } from '../../common/authority-checker.service'
import { LoggerModule } from '../../logger/logger.module'

describe('EventController', () => {
  let controller: EventController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      controllers: [EventController],
      providers: [EventService, PrismaService, AuthorityCheckerService]
    }).compile()

    controller = module.get<EventController>(EventController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
