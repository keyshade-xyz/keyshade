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
import { WorkspaceRoleService } from '../service/workspace-role.service'
import { CurrentUser } from '@/decorators/user.decorator'
import { Authority, User, Workspace, WorkspaceRole } from '@prisma/client'
import { CreateWorkspaceRole } from '../dto/create-workspace-role/create-workspace-role'
import { UpdateWorkspaceRole } from '../dto/update-workspace-role/update-workspace-role'
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'

@Controller('workspace-role')
export class WorkspaceRoleController {
  constructor(private readonly workspaceRoleService: WorkspaceRoleService) {}

  @Post(':workspaceSlug')
  @RequiredApiKeyAuthorities(Authority.CREATE_WORKSPACE_ROLE)
  async createWorkspaceRole(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Body() dto: CreateWorkspaceRole
  ) {
    return await this.workspaceRoleService.createWorkspaceRole(
      user,
      workspaceSlug,
      dto
    )
  }

  @Put(':workspaceRoleSlug')
  @RequiredApiKeyAuthorities(Authority.UPDATE_WORKSPACE_ROLE)
  async updateWorkspaceRole(
    @CurrentUser() user: User,
    @Param('workspaceRoleSlug') workspaceRoleSlug: WorkspaceRole['slug'],
    @Body() dto: UpdateWorkspaceRole
  ) {
    return await this.workspaceRoleService.updateWorkspaceRole(
      user,
      workspaceRoleSlug,
      dto
    )
  }

  @Delete(':workspaceRoleSlug')
  @RequiredApiKeyAuthorities(Authority.DELETE_WORKSPACE_ROLE)
  async deleteWorkspaceRole(
    @CurrentUser() user: User,
    @Param('workspaceRoleSlug') workspaceRoleSlug: WorkspaceRole['slug']
  ) {
    return await this.workspaceRoleService.deleteWorkspaceRole(
      user,
      workspaceRoleSlug
    )
  }

  @Get(':workspaceSlug/exists/:workspaceRoleName')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE_ROLE)
  async checkWorkspaceRoleExists(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Param('workspaceRoleName') name: WorkspaceRole['name']
  ) {
    return {
      exists: await this.workspaceRoleService.checkWorkspaceRoleExists(
        user,
        workspaceSlug,
        name
      )
    }
  }

  @Get(':workspaceRoleSlug')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE_ROLE)
  async getWorkspaceRole(
    @CurrentUser() user: User,
    @Param('workspaceRoleSlug') workspaceRoleSlug: WorkspaceRole['slug']
  ) {
    return await this.workspaceRoleService.getWorkspaceRole(
      user,
      workspaceRoleSlug
    )
  }

  @Get(':workspaceSlug/all')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE_ROLE)
  async getAllWorkspaceRolesOfWorkspace(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return await this.workspaceRoleService.getWorkspaceRolesOfWorkspace(
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
