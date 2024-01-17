import { Test, TestingModule } from '@nestjs/testing'
import { EnvironmentService } from './environment.service'
import { PrismaService } from '../../prisma/prisma.service'
import { mockDeep } from 'jest-mock-extended'

describe('EnvironmentService', () => {
  let service: EnvironmentService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnvironmentService, PrismaService]
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile()

    service = module.get<EnvironmentService>(EnvironmentService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
