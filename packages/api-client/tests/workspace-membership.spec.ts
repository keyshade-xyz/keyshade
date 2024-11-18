import WorkspaceMembershipController from '../src/controllers/workspace-membership'
import { APIClient } from '@api-client/core/client'

describe('Workspace Membership Controller Tests', () => {
  const backendUrl = process.env.BACKEND_URL
  const apiClient = new APIClient(backendUrl)
  const workspaceMembershipController = new WorkspaceMembershipController(
    backendUrl
  )
  const userEmail = 'johndoe@example.com'
  let workspaceSlug: string | null

  beforeAll(async () => {
    // Create a workspace for the tests
    const workspaceResponse = (await (
      await apiClient.post(
        '/api/workspace',
        { name: 'Test Workspace' },
        { 'x-e2e-user-email': userEmail }
      )
    ).json()) as any

    workspaceSlug = workspaceResponse.slug
  })

  afterAll(async () => {
    // Delete the workspace after tests
    await apiClient.delete(`/api/workspace/${workspaceSlug}`, {
      'x-e2e-user-email': userEmail
    })
  })

  it('should transfer ownership', async () => {
    const request = { workspaceSlug: workspaceSlug!, userEmail: userEmail }
    const response = await workspaceMembershipController.transferOwnership(
      request,
      {
        'x-e2e-user-email': userEmail
      }
    )

    expect(response).toBeTruthy()
  })

  it('should invite users', async () => {
    const request = {
      workspaceSlug: workspaceSlug!,
      emails: ['invitee@example.com'],
      members: [{ email: 'invitee@example.com', roleSlugs: ['member'] }]
    }
    const response = await workspaceMembershipController.inviteUsers(request, {
      'x-e2e-user-email': userEmail
    })

    expect(response).toBeTruthy()
  })

  it('should remove users', async () => {
    const request = {
      workspaceSlug: workspaceSlug!,
      userEmails: ['invitee@example.com']
    }
    const response = await workspaceMembershipController.removeUsers(request, {
      'x-e2e-user-email': userEmail
    })

    expect(response).toBeTruthy()
  })

  it('should update member roles', async () => {
    const request = {
      workspaceSlug: workspaceSlug!,
      userEmail: 'invitee@example.com',
      roleSlugs: ['admin']
    }
    const response = await workspaceMembershipController.updateMemberRoles(
      request,
      {
        'x-e2e-user-email': userEmail
      }
    )

    expect(response).toBeTruthy()
  })

  it('should accept an invitation', async () => {
    const request = { workspaceSlug: workspaceSlug! }
    const response = await workspaceMembershipController.acceptInvitation(
      request,
      {
        'x-e2e-user-email': userEmail
      }
    )

    expect(response).toBeTruthy()
  })

  it('should decline an invitation', async () => {
    const request = { workspaceSlug: workspaceSlug! }
    const response = await workspaceMembershipController.declineInvitation(
      request,
      {
        'x-e2e-user-email': userEmail
      }
    )

    expect(response).toBeTruthy()
  })

  it('should cancel an invitation', async () => {
    const request = {
      workspaceSlug: workspaceSlug!,
      userEmail: 'invitee@example.com'
    }
    const response = await workspaceMembershipController.cancelInvitation(
      request,
      {
        'x-e2e-user-email': userEmail
      }
    )

    expect(response).toBeTruthy()
  })

  it('should leave a workspace', async () => {
    const request = { workspaceSlug: workspaceSlug! }
    const response = await workspaceMembershipController.leaveWorkspace(
      request,
      {
        'x-e2e-user-email': userEmail
      }
    )

    expect(response).toBeTruthy()
  })

  it('should check if a user is a member', async () => {
    const request = { workspaceSlug: workspaceSlug!, userEmail: userEmail }
    const response = await workspaceMembershipController.isMember(request, {
      'x-e2e-user-email': userEmail
    })

    expect(response.data).toBe(true)
  })

  it('should get a list of members', async () => {
    const request = {
      workspaceSlug: workspaceSlug!,
      page: 0,
      limit: 10
    }
    const response = await workspaceMembershipController.getMembers(request, {
      'x-e2e-user-email': userEmail
    })

    expect(response.data.items.length).toBeGreaterThanOrEqual(0)
  })
})
