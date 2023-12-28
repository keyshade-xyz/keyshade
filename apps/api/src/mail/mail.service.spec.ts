import { Test, TestingModule } from '@nestjs/testing'
import { IMailService } from './services/mail.service.interface'
import { TestMail } from './services/fake.mail'

describe('MailService', () => {
  let service: IMailService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestMail]
    }).compile()

    service = module.get<TestMail>(TestMail)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
