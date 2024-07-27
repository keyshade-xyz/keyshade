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
import { CurrentUser } from '../../decorators/user.decorator'
import { Authority, Project, User, Workspace } from '@prisma/client'
import { CreateProject } from '../dto/create.project/create.project'
import { UpdateProject } from '../dto/update.project/update.project'
import { RequiredApiKeyAuthorities } from '../../decorators/required-api-key-authorities.decorator'
import { ForkProject } from '../dto/fork.project/fork.project'

@Controller('project')
export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  @Post(':workspaceId')
  @RequiredApiKeyAuthorities(Authority.CREATE_PROJECT)
  async createProject(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Body() dto: CreateProject
  ) {
    return await this.service.createProject(user, workspaceId, dto)
  }

  @Put(':projectId')
  @RequiredApiKeyAuthorities(Authority.UPDATE_PROJECT)
  async updateProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id'],
    @Body() dto: UpdateProject
  ) {
    return await this.service.updateProject(user, projectId, dto)
  }

  @Delete(':projectId')
  @RequiredApiKeyAuthorities(Authority.DELETE_PROJECT)
  async deleteProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id']
  ) {
    return await this.service.deleteProject(user, projectId)
  }

  @Get(':projectId')
  @RequiredApiKeyAuthorities(Authority.READ_PROJECT)
  async getProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id']
  ) {
    return await this.service.getProjectById(user, projectId)
  }

  @Post(':projectId/fork')
  @RequiredApiKeyAuthorities(Authority.READ_PROJECT, Authority.CREATE_PROJECT)
  async forkProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id'],
    @Body() forkMetadata: ForkProject
  ) {
    return await this.service.forkProject(user, projectId, forkMetadata)
  }

  @Put(':projectId/fork')
  @RequiredApiKeyAuthorities(Authority.READ_PROJECT, Authority.UPDATE_PROJECT)
  async syncFork(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id'],
    @Param('hardSync') hardSync: boolean = false
  ) {
    return await this.service.syncFork(user, projectId, hardSync)
  }

  @Delete(':projectId/fork')
  @RequiredApiKeyAuthorities(Authority.UPDATE_PROJECT)
  async unlinkFork(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id']
  ) {
    return await this.service.unlinkParentOfFork(user, projectId)
  }

  @Get(':projectId/forks')
  @RequiredApiKeyAuthorities(Authority.READ_PROJECT)
  async getForks(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id'],
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10
  ) {
    return await this.service.getAllProjectForks(user, projectId, page, limit)
  }

  @Get('/all/:workspaceId')
  @RequiredApiKeyAuthorities(Authority.READ_PROJECT)
  async getAllProjects(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return await this.service.getProjectsOfWorkspace(
      user,
      workspaceId,
      page,
      limit,
      sort,
      order,
      search
    )
  }
}
