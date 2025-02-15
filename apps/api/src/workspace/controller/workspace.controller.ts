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
import { Authority, Workspace } from '@prisma/client'
import { CreateWorkspace } from '../dto/create.workspace/create.workspace'
import { UpdateWorkspace } from '../dto/update.workspace/update.workspace'
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'
import { AuthenticatedUser } from '@/user/user.types'
import { UpdateBlacklistedIpAddresses } from '../dto/update.blacklistedIpAddresses/update.blacklistedIpAddresses'

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @RequiredApiKeyAuthorities(Authority.CREATE_WORKSPACE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWorkspace
  ) {
    return this.workspaceService.createWorkspace(user, dto)
  }

  @Put(':workspaceSlug')
  @RequiredApiKeyAuthorities(Authority.UPDATE_WORKSPACE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Body() dto: UpdateWorkspace
  ) {
    return this.workspaceService.updateWorkspace(user, workspaceSlug, dto)
  }

  @Delete(':workspaceSlug')
  @RequiredApiKeyAuthorities(Authority.DELETE_WORKSPACE)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.workspaceService.deleteWorkspace(user, workspaceSlug)
  }

  @Get('invitations')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async getAllInvitationsOfUser(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return this.workspaceService.getAllWorkspaceInvitations(
      user,
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
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.workspaceService.getWorkspaceBySlug(user, workspaceSlug)
  }

  @Get(':workspaceSlug/export-data')
  @RequiredApiKeyAuthorities(Authority.WORKSPACE_ADMIN)
  async exportData(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.workspaceService.exportData(user, workspaceSlug)
  }

  @Get()
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async getAllWorkspacesOfUser(
    @CurrentUser() user: AuthenticatedUser,
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
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Param('searchTerm') searchTerm: string
  ) {
    return this.workspaceService.globalSearch(user, workspaceSlug, searchTerm)
  }

  @Get(':workspaceSlug/blacklistedIpAddresses')
  @RequiredApiKeyAuthorities(Authority.WORKSPACE_ADMIN)
  async getBlacklistedIpAddresses(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.workspaceService.getBlacklistedIpAddresses(user, workspaceSlug)
  }

  @Put(':workspaceSlug/blacklistedIpAddresses')
  @RequiredApiKeyAuthorities(Authority.WORKSPACE_ADMIN)
  async updateBlacklistedIpAddresses(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug'],
    @Body() dto: UpdateBlacklistedIpAddresses
  ) {
    return this.workspaceService.updateBlacklistedIpAddresses(
      user,
      workspaceSlug,
      dto
    )
  }
}
