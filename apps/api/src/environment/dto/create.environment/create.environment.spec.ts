import { CreateEnvironment } from './create.environment'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

describe('CreateEnvironment', () => {
  it('should be defined', () => {
    expect(new CreateEnvironment()).toBeDefined()
  })

  it('should allow alphanumeric names with underscores', () => {
    const dto = plainToInstance(CreateEnvironment, {
      name: 'dev_Env2'
    })

    expect(validateSync(dto)).toHaveLength(0)
  })

  it('should reject names with unsupported characters', () => {
    const dto = plainToInstance(CreateEnvironment, {
      name: 'dev-env'
    })

    expect(validateSync(dto)).not.toHaveLength(0)
  })

  it('should reject names shorter than three characters', () => {
    const dto = plainToInstance(CreateEnvironment, {
      name: 'qa'
    })

    expect(validateSync(dto)).not.toHaveLength(0)
  })
})
