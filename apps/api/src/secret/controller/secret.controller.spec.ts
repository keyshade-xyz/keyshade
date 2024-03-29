import { Test, TestingModule } from '@nestjs/testing'
import { SecretController } from './secret.controller'
import { MAIL_SERVICE } from '../../mail/services/interface.service'
import { MockMailService } from '../../mail/services/mock.service'
import { SecretService } from '../service/secret.service'
import { PrismaService } from '../../prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'

describe('SecretController', () => {
  let controller: SecretController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecretController],
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

    controller = module.get<SecretController>(SecretController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
