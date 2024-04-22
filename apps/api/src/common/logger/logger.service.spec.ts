import { Test, TestingModule } from '@nestjs/testing'
import { CustomLoggerService } from './logger.service'

describe('LoggerService', () => {
  let service: CustomLoggerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomLoggerService]
    }).compile()

    service = module.get<CustomLoggerService>(CustomLoggerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
