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
import { WorkspaceService } from '../service/workspace.service'
import { CurrentUser } from '@/decorators/user.decorator'
import { Authority, User, Workspace, WorkspaceRole } from '@prisma/client'
import {
  CreateWorkspace,
  WorkspaceMemberDTO
} from '../dto/create.workspace/create.workspace'
import { UpdateWorkspace } from '../dto/update.workspace/update.workspace'
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @RequiredApiKeyAuthorities(Authority.CREATE_WORKSPACE)
  async create(@CurrentUser() user: User, @Body() dto: CreateWorkspace) {
    return this.workspaceService.createWorkspace(user, dto)
  }

  @Put(':workspaceSlug')
  @RequiredApiKeyAuthorities(Authority.UPDATE_WORKSPACE)
  async update(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Body() dto: UpdateWorkspace
  ) {
    return this.workspaceService.updateWorkspace(user, workspaceSlug, dto)
  }

  @Put(':workspaceSlug/transfer-ownership/:userEmail')
  @RequiredApiKeyAuthorities(Authority.WORKSPACE_ADMIN)
  async transferOwnership(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Param('userEmail') userEmail: User['email']
  ) {
    return this.workspaceService.transferOwnership(
      user,
      workspaceSlug,
      userEmail
    )
  }

  @Delete(':workspaceSlug')
  @RequiredApiKeyAuthorities(Authority.DELETE_WORKSPACE)
  async delete(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.workspaceService.deleteWorkspace(user, workspaceSlug)
  }

  @Post(':workspaceSlug/invite-users')
  @RequiredApiKeyAuthorities(Authority.ADD_USER)
  async addUsers(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Body() members: WorkspaceMemberDTO[]
  ) {
    return this.workspaceService.inviteUsersToWorkspace(
      user,
      workspaceSlug,
      members
    )
  }

  @Delete(':workspaceSlug/remove-users')
  @RequiredApiKeyAuthorities(Authority.REMOVE_USER)
  async removeUsers(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Body() userEmails: User['email'][]
  ) {
    return this.workspaceService.removeUsersFromWorkspace(
      user,
      workspaceSlug,
      userEmails
    )
  }

  @Put(':workspaceSlug/update-member-role/:userEmail')
  @RequiredApiKeyAuthorities(Authority.UPDATE_USER_ROLE)
  async updateMemberRoles(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Param('userEmail') userEmail: User['email'],
    @Body() roleSlugs: WorkspaceRole['slug'][]
  ) {
    return this.workspaceService.updateMemberRoles(
      user,
      workspaceSlug,
      userEmail,
      roleSlugs
    )
  }

  @Post(':workspaceSlug/accept-invitation')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async acceptInvitation(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.workspaceService.acceptInvitation(user, workspaceSlug)
  }

  @Delete(':workspaceSlug/decline-invitation')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async declineInvitation(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.workspaceService.declineInvitation(user, workspaceSlug)
  }

  @Delete(':workspaceSlug/cancel-invitation/:userEmail')
  @RequiredApiKeyAuthorities(Authority.REMOVE_USER)
  async cancelInvitation(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Param('userEmail') userEmail: User['email']
  ) {
    return this.workspaceService.cancelInvitation(
      user,
      workspaceSlug,
      userEmail
    )
  }

  @Delete(':workspaceSlug/leave')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async leave(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.workspaceService.leaveWorkspace(user, workspaceSlug)
  }

  @Get(':workspaceSlug/is-member/:userEmail')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async isMember(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Param('userEmail') userEmail: User['email']
  ) {
    return this.workspaceService.isUserMemberOfWorkspace(
      user,
      workspaceSlug,
      userEmail
    )
  }

  @Get(':workspaceSlug/members')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async getMembers(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return this.workspaceService.getAllMembersOfWorkspace(
      user,
      workspaceSlug,
      page,
      limit,
      sort,
      order,
      search
    )
  }

  @Get(':workspaceSlug')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async getWorkspace(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.workspaceService.getWorkspaceBySlug(user, workspaceSlug)
  }

  @Get(':workspaceSlug/export-data')
  @RequiredApiKeyAuthorities(Authority.WORKSPACE_ADMIN)
  async exportData(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.workspaceService.exportData(user, workspaceSlug)
  }

  @Get()
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async getAllWorkspacesOfUser(
    @CurrentUser() user: User,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return this.workspaceService.getWorkspacesOfUser(
      user,
      page,
      limit,
      sort,
      order,
      search
    )
  }

  @Get(':workspaceSlug/global-search/:searchTerm')
  @RequiredApiKeyAuthorities(
    Authority.READ_WORKSPACE,
    Authority.READ_ENVIRONMENT,
    Authority.READ_SECRET,
    Authority.READ_VARIABLE,
    Authority.READ_PROJECT
  )
  async globalSearch(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Param('searchTerm') searchTerm: string
  ) {
    return this.workspaceService.globalSearch(user, workspaceSlug, searchTerm)
  }
}
