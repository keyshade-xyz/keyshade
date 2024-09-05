import { Test, TestingModule } from '@nestjs/testing'
import { CacheService } from './cache.service'
import { REDIS_CLIENT } from '@/provider/redis.provider'

describe('CacheService', () => {
  let service: CacheService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: REDIS_CLIENT,
          useValue: {
            publisher: {
              // Add minimal mock methods as needed
              setEx: jest.fn(),
              set: jest.fn(),
              get: jest.fn(),
              del: jest.fn(),
              keys: jest.fn()
            }
          }
        }
      ]
    }).compile()

    service = module.get<CacheService>(CacheService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
