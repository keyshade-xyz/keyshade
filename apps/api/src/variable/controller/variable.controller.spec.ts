import { Test, TestingModule } from '@nestjs/testing'
import { VariableController } from './variable.controller'

describe('VariableController', () => {
  let controller: VariableController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VariableController]
    }).compile()

    controller = module.get<VariableController>(VariableController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
