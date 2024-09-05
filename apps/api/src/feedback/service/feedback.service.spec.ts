import { Test, TestingModule } from '@nestjs/testing'
import { FeedbackService } from './feedback.service'
import { MAIL_SERVICE } from '@/mail/services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'

describe('FeedbackService', () => {
  let service: FeedbackService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: MAIL_SERVICE, useClass: MockMailService }
      ]
    }).compile()

    service = module.get<FeedbackService>(FeedbackService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
