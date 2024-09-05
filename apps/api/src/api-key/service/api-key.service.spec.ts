import { Test, TestingModule } from '@nestjs/testing'
import { ApiKeyService } from './api-key.service'
import { PrismaService } from '@/prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'

describe('ApiKeyService', () => {
  let service: ApiKeyService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiKeyService, PrismaService]
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile()

    service = module.get<ApiKeyService>(ApiKeyService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
