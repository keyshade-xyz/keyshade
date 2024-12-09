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
import { Authority, User, Workspace } from '@prisma/client'
import { CreateWorkspace } from '../dto/create.workspace/create.workspace'
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

  @Delete(':workspaceSlug')
  @RequiredApiKeyAuthorities(Authority.DELETE_WORKSPACE)
  async delete(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['slug']
  ) {
    return this.workspaceService.deleteWorkspace(user, workspaceSlug)
  }

  @Get('invitations')
  @RequiredApiKeyAuthorities(Authority.READ_WORKSPACE)
  async getAllInvitationsOfUser(
    @CurrentUser() user: User,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = '',
    @Query('isAccepted') isAccepted: 'true' | 'false' | undefined = undefined
  ) {
    return this.workspaceService.getInvitationsOfUser(
      user,
      page,
      limit,
      sort,
      order,
      search,
      isAccepted ? isAccepted === 'true' : undefined
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
