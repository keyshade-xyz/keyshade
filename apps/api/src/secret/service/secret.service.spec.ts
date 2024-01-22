import { Test, TestingModule } from '@nestjs/testing'
import { SecretService } from './secret.service'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { PrismaService } from '../../prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'

describe('SecretService', () => {
  let service: SecretService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: MAIL_SERVICE,
          useClass: MockMailService
        },
        SecretService
      ]
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile()

    service = module.get<SecretService>(SecretService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
