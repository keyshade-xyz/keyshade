import {
  GetWorkspaceInvitationsRequestSchema,
  GetWorkspaceInvitationsResponseSchema
} from '@/workspace-invitations'

describe('Workspace Invitations Schema Tests', () => {
  describe('GetWorkspaceInvitationsRequestSchema Tests', () => {
    it('should validate if proper input is specified for GetWorkspaceInvitationsRequestSchema', () => {
      const result = GetWorkspaceInvitationsRequestSchema.safeParse({
        page: 1,
        limit: 10
      })

      expect(result.success).toBe(true)
    })
  })

  describe('GetWorkspaceInvitationsResponseSchema Tests', () => {
    it('should validate with proper input for GetWorkspaceInvitationsResponseSchema', () => {
      const result = GetWorkspaceInvitationsResponseSchema.safeParse({
        items: [
          {
            workspace: {
              id: 'workspace-id',
              name: 'Workspace Test',
              slug: 'workspace-slug',
              icon: 'icon.png'
            },
            roles: [
              {
                role: {
                  name: 'Admin',
                  colorCode: '#ff0000'
                }
              }
            ],
            inviteOn: '2024-10-01T00:00:00Z'
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

    it('should not validate if items are not an array in GetWorkspaceInvitationsResponseSchema', () => {
      const result = GetWorkspaceInvitationsResponseSchema.safeParse({
        items: 'not-an-array',
        total: 1,
        page: 1,
        limit: 10
      })

      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toEqual(['items'])
    })
  })
})
