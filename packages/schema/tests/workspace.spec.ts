import { CreateWorkspaceSchema, InviteMemberSchema } from '@/workspace'

describe('Workspace Schema Tests', () => {
  it('should validate if proper input is specified for CreateWorkspaceSchema', () => {
    const result = CreateWorkspaceSchema.safeParse({
      name: 'Workspace Test',
      isDefault: true
    })

    expect(result.success).toBe(true)
  })

  it('should validate if only required fields are specified for CreateWorkspaceSchema', () => {
    const result = CreateWorkspaceSchema.safeParse({
      name: 'Workspace Test'
    })

    expect(result.success).toBe(true)
  })

  it('should validate if optional fields are omitted for CreateWorkspaceSchema', () => {
    const result = CreateWorkspaceSchema.safeParse({
      name: 'Workspace Test'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if required fields are missing for CreateWorkspaceSchema', () => {
    const result = CreateWorkspaceSchema.safeParse({
      isDefault: true
    })

    expect(result.success).toBe(false)
    expect(result.error.issues).toHaveLength(1)
  })

  it('should not validate if invalid types are specified for CreateWorkspaceSchema', () => {
    const result = CreateWorkspaceSchema.safeParse({
      name: 123,
      isDefault: 'true'
    })

    expect(result.success).toBe(false)
    expect(result.error.issues).toHaveLength(2)
  })

  it('should validate if proper input is specified for InviteMemberSchema', () => {
    const result = InviteMemberSchema.safeParse({
      email: 'test@example.com',
      roleIds: ['role1', 'role2']
    })

    expect(result.success).toBe(true)
  })

  it('should validate if only required fields are specified for InviteMemberSchema', () => {
    const result = InviteMemberSchema.safeParse({
      email: 'test@example.com'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if required fields are missing for InviteMemberSchema', () => {
    const result = InviteMemberSchema.safeParse({
      roleIds: ['role1']
    })

    expect(result.success).toBe(false)
    expect(result.error.issues).toHaveLength(1)
  })

  it('should not validate if invalid types are specified for InviteMemberSchema', () => {
    const result = InviteMemberSchema.safeParse({
      email: 123,
      roleIds: 'invalid_role'
    })

    expect(result.success).toBe(false)
    expect(result.error.issues).toHaveLength(2)
  })
})
