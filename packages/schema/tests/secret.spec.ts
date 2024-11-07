import { CreateSecretSchema } from '@/secret'
import { rotateAfterEnum } from '@/enums/enums'

describe('Secret Schema Tests', () => {
  it('should validate if proper input is specified for CreateSecretSchema', () => {
    const result = CreateSecretSchema.safeParse({
      name: 'Secret Test',
      rotateAfter: rotateAfterEnum.enum['720'],
      entries: [{ environmentId: 'env123', value: 'secret-value' }]
    })

    expect(result.success).toBe(true)
  })

  it('should validate if only required fields are specified for CreateSecretSchema', () => {
    const result = CreateSecretSchema.safeParse({
      name: 'Secret Test',
      entries: [{ environmentId: 'env123', value: 'secret-value' }]
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if required fields are missing for CreateSecretSchema', () => {
    const result = CreateSecretSchema.safeParse({
      rotateAfter: rotateAfterEnum.enum['720']
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(2)
  })

  it('should not validate if invalid types are specified for CreateSecretSchema', () => {
    const result = CreateSecretSchema.safeParse({
      name: 123,
      entries: [{ environmentId: 'env123', value: 456 }]
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(2)
  })

  it('should validate if optional fields are omitted for CreateSecretSchema', () => {
    const result = CreateSecretSchema.safeParse({
      name: 'Secret Test',
      entries: [{ environmentId: 'env123', value: 'secret-value' }]
    })

    expect(result.success).toBe(true)
  })
})
