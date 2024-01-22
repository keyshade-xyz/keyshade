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
import { ProjectService } from '../service/project.service'
import { CurrentUser } from '../../decorators/user.decorator'
import { Project, User, Workspace } from '@prisma/client'
import { CreateProject } from '../dto/create.project/create.project'
import { UpdateProject } from '../dto/update.project/update.project'
import { AdminGuard } from '../../auth/guard/admin.guard'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('Project Controller')
@Controller('project')
export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  @Post(':workspaceId')
  async createProject(
    @CurrentUser() user: User,
    @Param() workspaceId: Workspace['id'],
    @Body() dto: CreateProject
  ) {
    return await this.service.createProject(user, workspaceId, dto)
  }

  @Put(':projectId')
  async updateProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id'],
    @Body() dto: UpdateProject
  ) {
    return await this.service.updateProject(user, projectId, dto)
  }

  @Delete(':projectId')
  async deleteProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id']
  ) {
    return await this.service.deleteProject(user, projectId)
  }

  @Get(':projectId')
  async getProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id']
  ) {
    return await this.service.getProjectByUserAndId(user, projectId)
  }

  @Get(':workspaceId')
  async getAllProjects(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: Workspace['id'],
    @Query('page') page: number = 1,
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

  @Get('admin/:projectId')
  @UseGuards(AdminGuard)
  async getProjectById(@Param('projectId') projectId: Project['id']) {
    return await this.service.getProjectById(projectId)
  }

  @Get('admin/all')
  @UseGuards(AdminGuard)
  async getAllProjectsAdmin(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return await this.service.getProjects(page, limit, sort, order, search)
  }
}
