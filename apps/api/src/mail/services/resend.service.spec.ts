import { Test, TestingModule } from '@nestjs/testing'
import { IMailService } from './interface.service'
import { MockMailService } from './mock.service'

describe('ResendService', () => {
  let service: IMailService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockMailService]
    }).compile()

    service = module.get<MockMailService>(MockMailService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
