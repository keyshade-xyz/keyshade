// workspace-membership.spec.ts
import {
  CreateWorkspaceMemberSchema,
  TransferOwnershipRequestSchema,
  TransferOwnershipResponseSchema,
  InviteUsersRequestSchema,
  InviteUsersResponseSchema,
  RemoveUsersRequestSchema,
  RemoveUsersResponseSchema,
  UpdateMemberRoleRequestSchema,
  UpdateMemberRoleResponseSchema,
  AcceptInvitationRequestSchema,
  AcceptInvitationResponseSchema,
  DeclineInvitationRequestSchema,
  DeclineInvitationResponseSchema,
  CancelInvitationRequestSchema,
  CancelInvitationResponseSchema,
  LeaveWorkspaceRequestSchema,
  LeaveWorkspaceResponseSchema,
  IsMemberRequestSchema,
  IsMemberResponseSchema,
  GetMembersRequestSchema,
  GetMembersResponseSchema
} from '@/workspace-membership'

describe('Workspace Membership Schema Tests', () => {
  describe('CreateWorkspaceMemberSchema Tests', () => {
    it('should validate a valid CreateWorkspaceMemberSchema', () => {
      const result = CreateWorkspaceMemberSchema.safeParse({
        email: 'user@example.com',
        roleSlugs: ['admin', 'editor']
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid CreateWorkspaceMemberSchema', () => {
      const result = CreateWorkspaceMemberSchema.safeParse({
        email: 'user@example', // Invalid email
        roleSlugs: 'admin' // Should be an array
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('TransferOwnershipRequestSchema Tests', () => {
    it('should validate a valid TransferOwnershipRequestSchema', () => {
      const result = TransferOwnershipRequestSchema.safeParse({
        workspaceSlug: 'workspace-slug',
        userEmail: 'user@example.com'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid TransferOwnershipRequestSchema', () => {
      const result = TransferOwnershipRequestSchema.safeParse({
        workspaceSlug: 123, // Should be a string
        userEmail: 'user@example' // Invalid email
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('TransferOwnershipResponseSchema Tests', () => {
    it('should validate a valid TransferOwnershipResponseSchema', () => {
      const result = TransferOwnershipResponseSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid TransferOwnershipResponseSchema', () => {
      const result = TransferOwnershipResponseSchema.safeParse({
        unexpectedField: 'value'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('InviteUsersRequestSchema Tests', () => {
    it('should validate a valid InviteUsersRequestSchema', () => {
      const result = InviteUsersRequestSchema.safeParse({
        workspaceSlug: 'workspace-slug',
        members: [
          {
            email: 'user1@example.com',
            roleSlugs: ['admin', 'editor']
          },
          {
            email: 'user2@example.com',
            roleSlugs: ['viewer']
          }
        ]
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid InviteUsersRequestSchema', () => {
      const result = InviteUsersRequestSchema.safeParse({
        workspaceSlug: 123, // Should be a string
        members: [
          {
            email: 'user1@example', // Invalid email
            roleSlugs: 'admin' // Should be an array
          }
        ]
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(3)
    })
  })

  describe('InviteUsersResponseSchema Tests', () => {
    it('should validate a valid InviteUsersResponseSchema', () => {
      const result = InviteUsersResponseSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid InviteUsersResponseSchema', () => {
      const result = InviteUsersResponseSchema.safeParse({
        unexpectedField: 'value'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('RemoveUsersRequestSchema Tests', () => {
    it('should validate a valid RemoveUsersRequestSchema', () => {
      const result = RemoveUsersRequestSchema.safeParse({
        workspaceSlug: 'workspace-slug',
        userEmails: 'user1@example.com,user2@example.com'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid RemoveUsersRequestSchema', () => {
      const result = RemoveUsersRequestSchema.safeParse({
        workspaceSlug: 123, // Should be a string
        userEmails: ['user1@example.com', 'user2@example.com'] // Should be a string of comma-separated emails
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('RemoveUsersResponseSchema Tests', () => {
    it('should validate a valid RemoveUsersResponseSchema', () => {
      const result = RemoveUsersResponseSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid RemoveUsersResponseSchema', () => {
      const result = RemoveUsersResponseSchema.safeParse({
        unexpectedField: 'value'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('UpdateMemberRoleRequestSchema Tests', () => {
    it('should validate a valid UpdateMemberRoleRequestSchema', () => {
      const result = UpdateMemberRoleRequestSchema.safeParse({
        workspaceSlug: 'workspace-slug',
        userEmail: 'user@example.com',
        roleSlugs: ['admin', 'editor']
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid UpdateMemberRoleRequestSchema', () => {
      const result = UpdateMemberRoleRequestSchema.safeParse({
        workspaceSlug: 123, // Should be a string
        userEmail: 'user@example', // Invalid email
        roleSlugs: 'admin' // Should be an array
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(3)
    })
  })

  describe('UpdateMemberRoleResponseSchema Tests', () => {
    it('should validate a valid UpdateMemberRoleResponseSchema', () => {
      const result = UpdateMemberRoleResponseSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid UpdateMemberRoleResponseSchema', () => {
      const result = UpdateMemberRoleResponseSchema.safeParse({
        unexpectedField: 'value'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('AcceptInvitationRequestSchema Tests', () => {
    it('should validate a valid AcceptInvitationRequestSchema', () => {
      const result = AcceptInvitationRequestSchema.safeParse({
        workspaceSlug: 'workspace-slug'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid AcceptInvitationRequestSchema', () => {
      const result = AcceptInvitationRequestSchema.safeParse({
        workspaceSlug: 123 // Should be a string
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('AcceptInvitationResponseSchema Tests', () => {
    it('should validate a valid AcceptInvitationResponseSchema', () => {
      const result = AcceptInvitationResponseSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid AcceptInvitationResponseSchema', () => {
      const result = AcceptInvitationResponseSchema.safeParse({
        unexpectedField: 'value'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('DeclineInvitationRequestSchema Tests', () => {
    it('should validate a valid DeclineInvitationRequestSchema', () => {
      const result = DeclineInvitationRequestSchema.safeParse({
        workspaceSlug: 'workspace-slug'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid DeclineInvitationRequestSchema', () => {
      const result = DeclineInvitationRequestSchema.safeParse({
        workspaceSlug: 123 // Should be a string
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('DeclineInvitationResponseSchema Tests', () => {
    it('should validate a valid DeclineInvitationResponseSchema', () => {
      const result = DeclineInvitationResponseSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid DeclineInvitationResponseSchema', () => {
      const result = DeclineInvitationResponseSchema.safeParse({
        unexpectedField: 'value'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('CancelInvitationRequestSchema Tests', () => {
    it('should validate a valid CancelInvitationRequestSchema', () => {
      const result = CancelInvitationRequestSchema.safeParse({
        workspaceSlug: 'workspace-slug',
        userEmail: 'user@example.com'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid CancelInvitationRequestSchema', () => {
      const result = CancelInvitationRequestSchema.safeParse({
        workspaceSlug: 123, // Should be a string
        userEmail: 'user@example' // Invalid email
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('CancelInvitationResponseSchema Tests', () => {
    it('should validate a valid CancelInvitationResponseSchema', () => {
      const result = CancelInvitationResponseSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid CancelInvitationResponseSchema', () => {
      const result = CancelInvitationResponseSchema.safeParse({
        unexpectedField: 'value'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('LeaveWorkspaceRequestSchema Tests', () => {
    it('should validate a valid LeaveWorkspaceRequestSchema', () => {
      const result = LeaveWorkspaceRequestSchema.safeParse({
        workspaceSlug: 'workspace-slug'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid LeaveWorkspaceRequestSchema', () => {
      const result = LeaveWorkspaceRequestSchema.safeParse({
        workspaceSlug: 123 // Should be a string
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('LeaveWorkspaceResponseSchema Tests', () => {
    it('should validate a valid LeaveWorkspaceResponseSchema', () => {
      const result = LeaveWorkspaceResponseSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid LeaveWorkspaceResponseSchema', () => {
      const result = LeaveWorkspaceResponseSchema.safeParse({
        unexpectedField: 'value'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('IsMemberRequestSchema Tests', () => {
    it('should validate a valid IsMemberRequestSchema', () => {
      const result = IsMemberRequestSchema.safeParse({
        workspaceSlug: 'workspace-slug',
        userEmail: 'user@example.com'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid IsMemberRequestSchema', () => {
      const result = IsMemberRequestSchema.safeParse({
        workspaceSlug: 123, // Should be a string
        userEmail: 'user@example' // Invalid email
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('IsMemberResponseSchema Tests', () => {
    it('should validate a valid IsMemberResponseSchema', () => {
      const result = IsMemberResponseSchema.safeParse(true)
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid IsMemberResponseSchema', () => {
      const result = IsMemberResponseSchema.safeParse('true') // Should be a boolean
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })

  describe('GetMembersRequestSchema Tests', () => {
    it('should validate a valid GetMembersRequestSchema', () => {
      const result = GetMembersRequestSchema.safeParse({
        page: 1,
        limit: 10,
        sort: 'name',
        order: 'asc',
        search: 'admin',
        workspaceSlug: 'workspace-slug'
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid GetMembersRequestSchema', () => {
      const result = GetMembersRequestSchema.safeParse({
        page: 'one', // Should be a number
        limit: 10,
        sort: 'name',
        order: 'asc',
        search: 'admin',
        workspaceSlug: 123 // Should be a string
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(2)
    })
  })

  describe('GetMembersResponseSchema Tests', () => {
    it('should validate a valid GetMembersResponseSchema', () => {
      const result = GetMembersResponseSchema.safeParse({
        items: [
          {
            id: 'member123',
            user: {
              id: 'user123',
              email: 'user@example.com',
              name: 'User Name',
              profilePictureUrl: 'http://example.com/profile.jpg',
              isActive: true,
              isOnboardingFinished: true,
              isAdmin: false,
              authProvider: 'GOOGLE'
            },
            roles: [
              {
                id: 'role123',
                role: {
                  id: 'role123',
                  name: 'Admin Role',
                  description: 'Role with admin privileges',
                  colorCode: '#FF5733',
                  authorities: ['CREATE_PROJECT'],
                  projects: [
                    {
                      id: 'project123'
                    }
                  ]
                }
              }
            ]
          }
        ],
        metadata: {
          page: 1,
          perPage: 10,
          pageCount: 1,
          totalCount: 1,
          links: {
            self: 'http://example.com/page/1',
            first: 'http://example.com/page/1',
            previous: null,
            next: null,
            last: 'http://example.com/page/1'
          }
        }
      })
      expect(result.success).toBe(true)
    })

    it('should not validate an invalid GetMembersResponseSchema', () => {
      const result = GetMembersResponseSchema.safeParse({
        items: 'not-an-array', // Should be an array
        metadata: {
          page: 1,
          perPage: 10,
          pageCount: 1,
          totalCount: 1,
          links: {
            self: 'http://example.com/page/1',
            first: 'http://example.com/page/1',
            previous: null,
            next: null,
            last: 'http://example.com/page/1'
          }
        }
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues).toHaveLength(1)
    })
  })
})
