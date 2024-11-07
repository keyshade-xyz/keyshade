import { CreateProjectSchema, ForkProjectSchema } from '@/project'
import { projectAccessLevelEnum } from '@/enums/enums'

describe('Project Schema Tests', () => {
  it('should validate if proper input is specified for CreateProjectSchema', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'Project Test',
      accessLevel: projectAccessLevelEnum.Enum.PRIVATE,
      environments: [{ name: 'Environment 1' }]
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if invalid values are specified for CreateProjectSchema', () => {
    const result = CreateProjectSchema.safeParse({
      name: 123,
      accessLevel: 'invalid_access_level'
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(2)
  })

  it('should validate if only required fields are specified for CreateProjectSchema', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'Project Test',
      accessLevel: projectAccessLevelEnum.Enum.PRIVATE
    })

    expect(result.success).toBe(true)
  })

  it('should validate if optional fields are omitted for CreateProjectSchema', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'Project Test',
      accessLevel: projectAccessLevelEnum.Enum.PRIVATE
    })

    expect(result.success).toBe(true)
  })

  it('should validate if proper input is specified for ForkProjectSchema', () => {
    const result = ForkProjectSchema.safeParse({
      workspaceId: 'workspace123',
      name: 'Forked Project',
      storePrivateKey: true
    })

    expect(result.success).toBe(true)
  })

  it('should validate if all fields are omitted for ForkProjectSchema', () => {
    const result = ForkProjectSchema.safeParse({})

    expect(result.success).toBe(true)
  })

  it('should not validate if invalid values are specified for ForkProjectSchema', () => {
    const result = ForkProjectSchema.safeParse({
      workspaceId: 123,
      storePrivateKey: 'invalid_boolean'
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(2)
  })
})
