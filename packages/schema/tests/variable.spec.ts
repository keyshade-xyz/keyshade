import { CreateVariableSchema } from '@/variable'

describe('Variable Schema Tests', () => {
  it('should validate if proper input is specified for CreateVariableSchema', () => {
    const result = CreateVariableSchema.safeParse({
      name: 'Variable Test',
      entries: [{ environmentId: 'env123', value: 'variable-value' }]
    })

    expect(result.success).toBe(true)
  })

  it('should validate if only required fields are specified for CreateVariableSchema', () => {
    const result = CreateVariableSchema.safeParse({
      name: 'Variable Test',
      entries: [{ environmentId: 'env123', value: 'variable-value' }]
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if required fields are missing for CreateVariableSchema', () => {
    const result = CreateVariableSchema.safeParse({
      entries: [{ environmentId: 'env123', value: 'variable-value' }]
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
  })

  it('should not validate if invalid types are specified for CreateVariableSchema', () => {
    const result = CreateVariableSchema.safeParse({
      name: 123,
      entries: [{ environmentId: 'env123', value: 456 }]
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(2)
  })

  it('should validate if optional fields are omitted for CreateVariableSchema', () => {
    const result = CreateVariableSchema.safeParse({
      name: 'Variable Test',
      entries: [{ environmentId: 'env123', value: 'variable-value' }]
    })

    expect(result.success).toBe(true)
  })

  it('should validate if note field is provided for CreateVariableSchema', () => {
    const result = CreateVariableSchema.safeParse({
      name: 'Variable Test',
      note: 'This is a note',
      entries: [{ environmentId: 'env123', value: 'variable-value' }]
    })

    expect(result.success).toBe(true)
  })
})
