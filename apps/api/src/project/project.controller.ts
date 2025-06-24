import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  Post,
  Put,
  Query
} from '@nestjs/common'
import { ProjectService } from './project.service'
import { CurrentUser } from '@/decorators/user.decorator'
import { Authority, Environment, Project, Workspace } from '@prisma/client'
import { CreateProject } from './dto/create.project/create.project'
import { UpdateProject } from './dto/update.project/update.project'
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'
import { ForkProject } from './dto/fork.project/fork.project'
import { AuthenticatedUser } from '@/user/user.types'

@Controller('project')
export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  @Post(':workspaceSlug')
  @RequiredApiKeyAuthorities(Authority.CREATE_PROJECT)
  async createProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['id'],
    @Body() dto: CreateProject
  ) {
    return await this.service.createProject(user, workspaceSlug, dto)
  }

  @Put(':projectSlug')
  @RequiredApiKeyAuthorities(Authority.UPDATE_PROJECT)
  async updateProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectSlug') projectSlug: Project['slug'],
    @Body() dto: UpdateProject
  ) {
    return await this.service.updateProject(user, projectSlug, dto)
  }

  @Delete(':projectSlug')
  @RequiredApiKeyAuthorities(Authority.DELETE_PROJECT)
  async deleteProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectSlug') projectSlug: Project['slug']
  ) {
    return await this.service.deleteProject(user, projectSlug)
  }

  @Get(':projectSlug')
  @RequiredApiKeyAuthorities(Authority.READ_PROJECT)
  async getProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectSlug') projectSlug: Project['slug']
  ) {
    return await this.service.getProject(user, projectSlug)
  }

  @Post(':projectSlug/fork')
  @RequiredApiKeyAuthorities(Authority.READ_PROJECT, Authority.CREATE_PROJECT)
  async forkProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectSlug') projectSlug: Project['slug'],
    @Body() forkMetadata: ForkProject
  ) {
    return await this.service.forkProject(user, projectSlug, forkMetadata)
  }

  @Put(':projectSlug/fork')
  @RequiredApiKeyAuthorities(Authority.READ_PROJECT, Authority.UPDATE_PROJECT)
  async syncFork(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectSlug') projectSlug: Project['slug'],
    @Query('hardSync') hardSync: boolean = false
  ) {
    return await this.service.syncFork(user, projectSlug, hardSync)
  }

  @Delete(':projectSlug/fork')
  @RequiredApiKeyAuthorities(Authority.UPDATE_PROJECT)
  async unlinkFork(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectSlug') projectSlug: Project['slug']
  ) {
    return await this.service.unlinkParentOfFork(user, projectSlug)
  }

  @Get(':projectSlug/forks')
  @RequiredApiKeyAuthorities(Authority.READ_PROJECT)
  async getForks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectSlug') projectSlug: Project['slug'],
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10
  ) {
    return await this.service.getAllProjectForks(user, projectSlug, page, limit)
  }

  @Get('/all/:workspaceSlug')
  @RequiredApiKeyAuthorities(Authority.READ_PROJECT)
  async getAllProjects(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: Workspace['id'],
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return await this.service.getProjectsOfWorkspace(
      user,
      workspaceSlug,
      page,
      limit,
      sort,
      order,
      search
    )
  }

  @Get(':projectSlug/export-configurations')
  @RequiredApiKeyAuthorities(
    Authority.READ_PROJECT,
    Authority.READ_SECRET,
    Authority.READ_VARIABLE,
    Authority.READ_ENVIRONMENT
  )
  async exportProjectConfigurations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectSlug') projectSlug: Project['slug'],
    @Query('environmentSlugs', new ParseArrayPipe({ items: String }))
    environmentSlugs: Environment['slug'][]
  ) {
    return await this.service.exportProjectConfigurations(
      user,
      projectSlug,
      environmentSlugs
    )
  }
}
