import { CreateWorkspaceRoleSchema } from '@/workspace-role'
import { authorityEnum } from '@/enums'

describe('Workspace Role Schema Tests', () => {
  it('should validate if proper input is specified for CreateWorkspaceRoleSchema', () => {
    const result = CreateWorkspaceRoleSchema.safeParse({
      name: 'Admin Role',
      authorities: [authorityEnum.enum['CREATE_PROJECT']],
      projectIds: ['project1', 'project2']
    })

    expect(result.success).toBe(true)
  })

  it('should validate if only required fields are specified for CreateWorkspaceRoleSchema', () => {
    const result = CreateWorkspaceRoleSchema.safeParse({
      name: 'Viewer Role'
    })

    expect(result.success).toBe(true)
  })

  it('should validate if optional fields are omitted for CreateWorkspaceRoleSchema', () => {
    const result = CreateWorkspaceRoleSchema.safeParse({
      name: 'Manager Role'
    })

    expect(result.success).toBe(true)
  })

  it('should not validate if required fields are missing for CreateWorkspaceRoleSchema', () => {
    const result = CreateWorkspaceRoleSchema.safeParse({
      authorities: [authorityEnum.enum['READ_USERS']]
    })

    expect(result.success).toBe(false)
    expect(result.error.issues).toHaveLength(1)
  })

  it('should not validate if invalid types are specified for CreateWorkspaceRoleSchema', () => {
    const result = CreateWorkspaceRoleSchema.safeParse({
      name: 123,
      authorities: ['invalid_authority']
    })

    expect(result.success).toBe(false)
    expect(result.error.issues).toHaveLength(2)
  })

  it('should validate if all optional fields are provided for CreateWorkspaceRoleSchema', () => {
    const result = CreateWorkspaceRoleSchema.safeParse({
      name: 'Custom Role',
      description: 'This is a custom role',
      colorCode: '#FF5733',
      authorities: [
        authorityEnum.enum['CREATE_PROJECT'],
        authorityEnum.enum['READ_USERS']
      ],
      projectIds: ['project1', 'project2']
    })

    expect(result.success).toBe(true)
  })
})
