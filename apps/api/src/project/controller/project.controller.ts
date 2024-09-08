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
import { ProjectService } from '../service/project.service'
import { CurrentUser } from '@/decorators/user.decorator'
import { Authority, Project, User, Workspace } from '@prisma/client'
import { CreateProject } from '../dto/create.project/create.project'
import { UpdateProject } from '../dto/update.project/update.project'
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'
import { ForkProject } from '../dto/fork.project/fork.project'

@Controller('project')
export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  @Post(':workspaceSlug')
  @RequiredApiKeyAuthorities(Authority.CREATE_PROJECT)
  async createProject(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: Workspace['id'],
    @Body() dto: CreateProject
  ) {
    return await this.service.createProject(user, workspaceSlug, dto)
  }

  @Put(':projectSlug')
  @RequiredApiKeyAuthorities(Authority.UPDATE_PROJECT)
  async updateProject(
    @CurrentUser() user: User,
    @Param('projectSlug') projectSlug: Project['slug'],
    @Body() dto: UpdateProject
  ) {
    return await this.service.updateProject(user, projectSlug, dto)
  }

  @Delete(':projectSlug')
  @RequiredApiKeyAuthorities(Authority.DELETE_PROJECT)
  async deleteProject(
    @CurrentUser() user: User,
    @Param('projectSlug') projectSlug: Project['slug']
  ) {
    return await this.service.deleteProject(user, projectSlug)
  }

  @Get(':projectSlug')
  @RequiredApiKeyAuthorities(Authority.READ_PROJECT)
  async getProject(
    @CurrentUser() user: User,
    @Param('projectSlug') projectSlug: Project['slug']
  ) {
    return await this.service.getProject(user, projectSlug)
  }

  @Post(':projectSlug/fork')
  @RequiredApiKeyAuthorities(Authority.READ_PROJECT, Authority.CREATE_PROJECT)
  async forkProject(
    @CurrentUser() user: User,
    @Param('projectSlug') projectSlug: Project['slug'],
    @Body() forkMetadata: ForkProject
  ) {
    return await this.service.forkProject(user, projectSlug, forkMetadata)
  }

<<<<<<< HEAD
  @Put(':projectSlug/fork')
=======
  @Put(':projectId/sync-fork')
>>>>>>> 6ac6f14 (Revert "Fix: merge conflicts")
  @RequiredApiKeyAuthorities(Authority.READ_PROJECT, Authority.UPDATE_PROJECT)
  async syncFork(
    @CurrentUser() user: User,
    @Param('projectSlug') projectSlug: Project['slug'],
    @Param('hardSync') hardSync: boolean = false
  ) {
    return await this.service.syncFork(user, projectSlug, hardSync)
  }

<<<<<<< HEAD
  @Delete(':projectSlug/fork')
=======
  @Put(':projectId/unlink-fork')
>>>>>>> 6ac6f14 (Revert "Fix: merge conflicts")
  @RequiredApiKeyAuthorities(Authority.UPDATE_PROJECT)
  async unlinkFork(
    @CurrentUser() user: User,
    @Param('projectSlug') projectSlug: Project['slug']
  ) {
    return await this.service.unlinkParentOfFork(user, projectSlug)
  }

  @Get(':projectSlug/forks')
  @RequiredApiKeyAuthorities(Authority.READ_PROJECT)
  async getForks(
    @CurrentUser() user: User,
    @Param('projectSlug') projectSlug: Project['slug'],
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10
  ) {
    return await this.service.getAllProjectForks(user, projectSlug, page, limit)
  }

  @Get('/all/:workspaceSlug')
  @RequiredApiKeyAuthorities(Authority.READ_PROJECT)
  async getAllProjects(
    @CurrentUser() user: User,
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
}
