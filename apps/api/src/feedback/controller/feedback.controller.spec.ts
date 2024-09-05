import { Test, TestingModule } from '@nestjs/testing'
import { FeedbackController } from './feedback.controller'
import { FeedbackService } from '../service/feedback.service'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'

describe('FeedbackController', () => {
  let controller: FeedbackController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [
        FeedbackService,
        { provide: MAIL_SERVICE, useValue: MockMailService }
      ]
    }).compile()

    controller = module.get<FeedbackController>(FeedbackController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
