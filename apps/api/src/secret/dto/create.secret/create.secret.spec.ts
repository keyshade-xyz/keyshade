import { CreateSecret } from './create.secret'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

describe('CreateSecret', () => {
  it('should be defined', () => {
    expect(new CreateSecret()).toBeDefined()
  })

  it('should allow alphanumeric names with underscores', () => {
    const dto = plainToInstance(CreateSecret, {
      name: 'API_KEY_19'
    })

    expect(validateSync(dto)).toHaveLength(0)
  })

  it('should reject names with unsupported characters', () => {
    const dto = plainToInstance(CreateSecret, {
      name: 'API-KEY'
    })

    expect(validateSync(dto)).not.toHaveLength(0)
  })

  it('should reject unicode names', () => {
    const dto = plainToInstance(CreateSecret, {
      name: 'ключ'
    })

    expect(validateSync(dto)).not.toHaveLength(0)
  })
})
