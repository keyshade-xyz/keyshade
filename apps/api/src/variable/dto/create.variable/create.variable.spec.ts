import { CreateVariable } from './create.variable'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

describe('CreateVariable', () => {
  it('should be defined', () => {
    expect(new CreateVariable()).toBeDefined()
  })

  it('should allow alphanumeric names with underscores', () => {
    const dto = plainToInstance(CreateVariable, {
      name: 'PORT_NUMBER_19'
    })

    expect(validateSync(dto)).toHaveLength(0)
  })

  it('should reject names with unsupported characters', () => {
    const dto = plainToInstance(CreateVariable, {
      name: 'PORT NUMBER'
    })

    expect(validateSync(dto)).not.toHaveLength(0)
  })

  it('should reject unicode names', () => {
    const dto = plainToInstance(CreateVariable, {
      name: 'ポート'
    })

    expect(validateSync(dto)).not.toHaveLength(0)
  })
})
