import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common'
import { WorkspaceService } from '../service/workspace.service'
import { CurrentUser } from '../../decorators/user.decorator'
import { User, Workspace, WorkspaceRole } from '@prisma/client'
import {
  CreateWorkspace,
  WorkspaceMemberDTO
} from '../dto/create.workspace/create.workspace'
import { UpdateWorkspace } from '../dto/update.workspace/update.workspace'
import { AdminGuard } from '../../auth/guard/admin.guard'

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  async create(@CurrentUser() user: User, @Body() dto: CreateWorkspace) {
    return this.workspaceService.createWorkspace(user, dto)
  }

  @Put(':workspaceId')
  async update(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Body() dto: UpdateWorkspace
  ) {
    return this.workspaceService.updateWorkspace(user, workspaceId, dto)
  }

  @Put(':workspaceId/transfer-ownership/:userId')
  async transferOwnership(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Param('userId') userId: User['id']
  ) {
    return this.workspaceService.transferOwnership(user, workspaceId, userId)
  }

  @Delete(':workspaceId')
  async delete(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id']
  ) {
    return this.workspaceService.deleteWorkspace(user, workspaceId)
  }

  @Post(':workspaceId/add-users')
  async addUsers(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Body() members: WorkspaceMemberDTO[]
  ) {
    return this.workspaceService.addUsersToWorkspace(user, workspaceId, members)
  }

  @Delete(':workspaceId/remove-users')
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
  async updateMemberRole(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Param('userId') userId: User['id'],
    @Query('role') role: WorkspaceRole
  ) {
    return this.workspaceService.updateMemberRole(
      user,
      workspaceId,
      userId,
      role
    )
  }

  @Post(':workspaceId/accept-invitation')
  async acceptInvitation(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id']
  ) {
    return this.workspaceService.acceptInvitation(user, workspaceId)
  }

  @Delete(':workspaceId/decline-invitation')
  async declineInvitation(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id']
  ) {
    return this.workspaceService.declineInvitation(user, workspaceId)
  }

  @Delete(':workspaceId/cancel-invitation/:userId')
  async cancelInvitation(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Param('userId') userId: User['id']
  ) {
    return this.workspaceService.cancelInvitation(user, workspaceId, userId)
  }

  @Delete(':workspaceId/leave')
  async leave(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id']
  ) {
    return this.workspaceService.leaveWorkspace(user, workspaceId)
  }

  @Get(':workspaceId/is-member/:userId')
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

  @Get(':workspaceId')
  async getWorkspace(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id']
  ) {
    return this.workspaceService.getWorkspaceById(user, workspaceId)
  }

  @Get()
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

  @UseGuards(AdminGuard)
  @Get()
  async getAllWorkspaces(
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return this.workspaceService.getWorkspaces(page, limit, sort, order, search)
  }
}
