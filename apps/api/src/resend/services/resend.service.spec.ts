import { Test, TestingModule } from '@nestjs/testing'
import { IResendService } from './resend.service.interface'
import { MockResend } from './mock.resend'

describe('ResendService', () => {
  let service: IResendService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockResend]
    }).compile()

    service = module.get<MockResend>(MockResend)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
