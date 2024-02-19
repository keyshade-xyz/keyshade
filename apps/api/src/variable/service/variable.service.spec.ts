import { Test, TestingModule } from '@nestjs/testing'
import { VariableService } from './variable.service'

describe('VariableService', () => {
  let service: VariableService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VariableService]
    }).compile()

    service = module.get<VariableService>(VariableService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
