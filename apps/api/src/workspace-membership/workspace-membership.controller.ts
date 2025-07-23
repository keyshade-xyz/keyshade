import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'
import { CurrentUser } from '@/decorators/user.decorator'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common'
import { Authority, User, Workspace, WorkspaceRole } from '@prisma/client'
import { CreateWorkspaceMember } from './dto/create.workspace/create.workspace-membership'
import { WorkspaceMembershipService } from './workspace-membership.service'
import { AuthenticatedUser } from '@/user/user.types'

@Controller('workspace-membership')
export class WorkspaceMembershipController {
  constructor(
    private readonly workspaceMembershipService: WorkspaceMembershipService
  ) {}

  @Put(':workspaceSlug/transfer-ownership/:userEmail')
  @RequiredApiKeyAuthorities(Authority.WORKSPACE_ADMIN)
  async transferOwnership(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Param('userEmail') userEmail: User['email']
  ) {
    return this.workspaceMembershipService.transferOwnership(
      user,
      workspaceSlug,
      userEmail
    )
  }

  @Post(':workspaceSlug/invite-users')
  @RequiredApiKeyAuthorities(Authority.ADD_USER, Authority.READ_WORKSPACE)
  async addUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Body() members: CreateWorkspaceMember[]
  ) {
    return this.workspaceMembershipService.inviteUsersToWorkspace(
      user,
      workspaceSlug,
      members
    )
  }

  @Delete(':workspaceSlug/remove-users')
  @RequiredApiKeyAuthorities(Authority.REMOVE_USER, Authority.READ_WORKSPACE)
  async removeUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Query('userEmails') userEmails: string = ''
  ) {
    return this.workspaceMembershipService.removeUsersFromWorkspace(
      user,
      workspaceSlug,
      userEmails.split(/\s*,\s*/)
    )
  }

  @Put(':workspaceSlug/update-member-role/:userEmail')
  @RequiredApiKeyAuthorities(
    Authority.UPDATE_USER_ROLE,
    Authority.READ_WORKSPACE
  )
  async updateMemberRoles(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Param('userEmail') userEmail: User['email'],
    @Body() roleSlugs: WorkspaceRole['slug'][]
  ) {
    return this.workspaceMembershipService.updateMemberRoles(
      user,
      workspaceSlug,
      userEmail,
      roleSlugs
    )
  }

  @Post(':workspaceSlug/accept-invitation')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async acceptInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.workspaceMembershipService.acceptInvitation(user, workspaceSlug)
  }

  @Delete(':workspaceSlug/decline-invitation')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async declineInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.workspaceMembershipService.declineInvitation(
      user,
      workspaceSlug
    )
  }

  @Delete(':workspaceSlug/cancel-invitation/:userEmail')
  @RequiredApiKeyAuthorities(Authority.REMOVE_USER)
  async cancelInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Param('userEmail') userEmail: User['email']
  ) {
    return this.workspaceMembershipService.cancelInvitation(
      user,
      workspaceSlug,
      userEmail
    )
  }

  @Delete(':workspaceSlug/leave')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async leave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.workspaceMembershipService.leaveWorkspace(user, workspaceSlug)
  }

  @Get(':workspaceSlug/is-member/:userEmail')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async isMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Param('userEmail') userEmail: User['email']
  ) {
    return this.workspaceMembershipService.isUserMemberOfWorkspace(
      user,
      workspaceSlug,
      userEmail
    )
  }

  @Put(':workspaceSlug/resend-invitation/:userEmail')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE, Authority.ADD_USER)
  async resendInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Param('userEmail') userEmail: User['email']
  ) {
    return this.workspaceMembershipService.resendInvitation(
      user,
      userEmail,
      workspaceSlug
    )
  }

  @Get(':workspaceSlug/members')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async getMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return this.workspaceMembershipService.getAllMembersOfWorkspace(
      user,
      workspaceSlug,
      page,
      limit,
      sort,
      order,
      search
    )
  }
}
