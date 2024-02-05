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
import { WorkspaceRoleService } from '../service/workspace-role.service'
import { CurrentUser } from '../../decorators/user.decorator'
import { User, Workspace, WorkspaceRole } from '@prisma/client'
import { CreateWorkspaceRole } from '../dto/create-workspace-role/create-workspace-role'
import { AdminGuard } from '../../auth/guard/admin.guard'
import { UpdateWorkspaceRole } from '../dto/update-workspace-role/update-workspace-role'

@Controller('workspace-role')
export class WorkspaceRoleController {
  constructor(private readonly workspaceRoleService: WorkspaceRoleService) {}

  @Post(':workspaceId')
  async createWorkspaceRole(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Body() dto: CreateWorkspaceRole
  ) {
    return await this.workspaceRoleService.createWorkspaceRole(
      user,
      workspaceId,
      dto
    )
  }

  @Put(':workspaceRoleId')
  async updateWorkspaceRole(
    @CurrentUser() user: User,
    @Param('workspaceRoleId') workspaceRoleId: WorkspaceRole['id'],
    @Body() dto: UpdateWorkspaceRole
  ) {
    return await this.workspaceRoleService.updateWorkspaceRole(
      user,
      workspaceRoleId,
      dto
    )
  }

  @Delete(':workspaceRoleId')
  async deleteWorkspaceRole(
    @CurrentUser() user: User,
    @Param('workspaceRoleId') workspaceRoleId: WorkspaceRole['id']
  ) {
    return await this.workspaceRoleService.deleteWorkspaceRole(
      user,
      workspaceRoleId
    )
  }

  @Get(':workspaceId/exists/:workspaceRoleName')
  async checkWorkspaceRoleExists(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Param('workspaceRoleName') name: WorkspaceRole['name']
  ) {
    return {
      exists: await this.workspaceRoleService.checkWorkspaceRoleExists(
        user,
        workspaceId,
        name
      )
    }
  }

  @Get(':workspaceRoleId')
  async getWorkspaceRole(
    @CurrentUser() user: User,
    @Param('workspaceRoleId') workspaceRoleId: WorkspaceRole['id']
  ) {
    return await this.workspaceRoleService.getWorkspaceRole(
      user,
      workspaceRoleId
    )
  }

  @Get(':workspaceId/all')
  async getAllWorkspaceRolesOfWorkspace(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return await this.workspaceRoleService.getWorkspaceRolesOfWorkspace(
      user,
      workspaceId,
      page,
      limit,
      sort,
      order,
      search
    )
  }

  @Get()
  @UseGuards(AdminGuard)
  async getAllWorkspaceRoles(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return await this.workspaceRoleService.getWorkspaceRoles(
      page,
      limit,
      sort,
      order,
      search
    )
  }
}
