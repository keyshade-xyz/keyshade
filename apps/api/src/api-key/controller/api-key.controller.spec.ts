import { Test, TestingModule } from '@nestjs/testing'
import { ApiKeyController } from './api-key.controller'
import { PrismaService } from '@/prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'
import { ApiKeyService } from '@/api-key/service/api-key.service'

describe('ApiKeyController', () => {
  let controller: ApiKeyController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeyController],
      providers: [ApiKeyService, PrismaService]
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile()

    controller = module.get<ApiKeyController>(ApiKeyController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
