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
import { CurrentUser } from '../../decorators/user.decorator'
import { Authority, User, Workspace, WorkspaceRole } from '@prisma/client'
import {
  CreateWorkspace,
  WorkspaceMemberDTO
} from '../dto/create.workspace/create.workspace'
import { UpdateWorkspace } from '../dto/update.workspace/update.workspace'
import { RequiredApiKeyAuthorities } from '../../decorators/required-api-key-authorities.decorator'

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @RequiredApiKeyAuthorities(Authority.CREATE_WORKSPACE)
  async create(@CurrentUser() user: User, @Body() dto: CreateWorkspace) {
    return this.workspaceService.createWorkspace(user, dto)
  }

  @Put(':workspaceId')
  @RequiredApiKeyAuthorities(Authority.UPDATE_WORKSPACE)
  async update(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Body() dto: UpdateWorkspace
  ) {
    return this.workspaceService.updateWorkspace(user, workspaceId, dto)
  }

  @Put(':workspaceId/transfer-ownership/:userId')
  @RequiredApiKeyAuthorities(Authority.WORKSPACE_ADMIN)
  async transferOwnership(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Param('userId') userId: User['id']
  ) {
    return this.workspaceService.transferOwnership(user, workspaceId, userId)
  }

  @Delete(':workspaceId')
  @RequiredApiKeyAuthorities(Authority.DELETE_WORKSPACE)
  async delete(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id']
  ) {
    return this.workspaceService.deleteWorkspace(user, workspaceId)
  }

  @Post(':workspaceId/invite-users')
  @RequiredApiKeyAuthorities(Authority.ADD_USER)
  async addUsers(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Body() members: WorkspaceMemberDTO[]
  ) {
    return this.workspaceService.inviteUsersToWorkspace(
      user,
      workspaceId,
      members
    )
  }

  @Delete(':workspaceId/remove-users')
  @RequiredApiKeyAuthorities(Authority.REMOVE_USER)
  async removeUsers(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Body() userIds: User['id'][]
  ) {
    return this.workspaceService.removeUsersFromWorkspace(
      user,
      workspaceId,
      userIds
    )
  }

  @Put(':workspaceId/update-member-role/:userId')
  @RequiredApiKeyAuthorities(Authority.UPDATE_USER_ROLE)
  async updateMemberRoles(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Param('userId') userId: User['id'],
    @Body() roleIds: WorkspaceRole['id'][]
  ) {
    return this.workspaceService.updateMemberRoles(
      user,
      workspaceId,
      userId,
      roleIds
    )
  }

  @Post(':workspaceId/accept-invitation')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async acceptInvitation(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id']
  ) {
    return this.workspaceService.acceptInvitation(user, workspaceId)
  }

  @Delete(':workspaceId/decline-invitation')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async declineInvitation(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id']
  ) {
    return this.workspaceService.declineInvitation(user, workspaceId)
  }

  @Delete(':workspaceId/cancel-invitation/:userId')
  @RequiredApiKeyAuthorities(Authority.REMOVE_USER)
  async cancelInvitation(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Param('userId') userId: User['id']
  ) {
    return this.workspaceService.cancelInvitation(user, workspaceId, userId)
  }

  @Delete(':workspaceId/leave')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async leave(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id']
  ) {
    return this.workspaceService.leaveWorkspace(user, workspaceId)
  }

  @Get(':workspaceId/is-member/:userId')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async isMember(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Param('userId') userId: User['id']
  ) {
    return this.workspaceService.isUserMemberOfWorkspace(
      user,
      workspaceId,
      userId
    )
  }

  @Get(':workspaceId/members')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async getMembers(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return this.workspaceService.getAllMembersOfWorkspace(
      user,
      workspaceId,
      page,
      limit,
      sort,
      order,
      search
    )
  }

  @Get(':workspaceId')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async getWorkspace(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id']
  ) {
    return this.workspaceService.getWorkspaceById(user, workspaceId)
  }

  @Get(':workspaceId/export-data')
  @RequiredApiKeyAuthorities(Authority.WORKSPACE_ADMIN)
  async exportData(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id']
  ) {
    return this.workspaceService.exportData(user, workspaceId)
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
}
