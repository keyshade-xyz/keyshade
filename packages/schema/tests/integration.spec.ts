import { CreateIntegrationSchema } from '@/integration'
import { eventTypeEnum, integrationTypeEnum } from '@/enums'

describe('Integration Schema Tests', () => {
  it('should validate if proper input is specified', () => {
    const result = CreateIntegrationSchema.safeParse({
      name: 'Integration Test',
      type: integrationTypeEnum.Enum.DISCORD,
      metadata: { key: 'value' },
      notifyOn: [eventTypeEnum.Enum.ACCEPTED_INVITATION]
    })

    expect(result.success).toBe(true)
  })

  it('should validate if only required fields are specified', () => {
    const result = CreateIntegrationSchema.safeParse({
      name: 'Integration Test',
      type: integrationTypeEnum.Enum.DISCORD,
      metadata: { key: 'value' }
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if invalid values are specified', () => {
    const result = CreateIntegrationSchema.safeParse({
      name: 123,
      type: integrationTypeEnum.Enum.DISCORD,
      metadata: 'invalid metadata'
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(2)
  })

  it('should not validate if required values are not specified', () => {
    const result = CreateIntegrationSchema.safeParse({
      metadata: { key: 'value' }
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(2)
  })

  it('should validate with optional fields omitted', () => {
    const result = CreateIntegrationSchema.safeParse({
      name: 'Integration Test',
      type: integrationTypeEnum.Enum.DISCORD,
      metadata: { key: 'value' }
    })

    expect(result.success).toBe(true)
  })

  it('should validate if empty notifyOn array is provided', () => {
    const result = CreateIntegrationSchema.safeParse({
      name: 'Integration Test',
      type: integrationTypeEnum.Enum.DISCORD,
      metadata: { key: 'value' },
      notifyOn: []
    })

    expect(result.success).toBe(true)
  })
})
