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
import { Project, ProjectRole, User } from '@prisma/client'
import {
  CreateProject,
  ProjectMemberDTO
} from '../dto/create.project/create.project'
import { UpdateProject } from '../dto/update.project/update.project'
import { AdminGuard } from '../../auth/guard/admin.guard'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('Project Controller')
@Controller('project')
export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  @Post()
  async createProject(@CurrentUser() user: User, @Body() dto: CreateProject) {
    return await this.service.createProject(user, dto)
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

  @Post(':projectId/member')
  async addUsersToProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id'],
    @Body() members: ProjectMemberDTO[]
  ) {
    return await this.service.addUsersToProject(user, projectId, members)
  }

  @Delete(':projectId/member')
  async removeUsersFromProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id'],
    @Body() userIds: User['id'][]
  ) {
    return await this.service.removeUsersFromProject(user, projectId, userIds)
  }

  @Put(':projectId/member')
  async updateMemberRole(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id'],
    @Query('userId') userId: User['id'],
    @Query('role') role: ProjectRole
  ) {
    return await this.service.updateMemberRole(user, projectId, userId, role)
  }

  @Get(':projectId/is-member/:userId')
  async isMemberOfProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id'],
    @Param('userId') userId: User['id']
  ) {
    return await this.service.isUserMemberOfProject(user, projectId, userId)
  }

  @Put(':projectId/accept-invitation')
  async acceptInvitation(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id']
  ) {
    return await this.service.acceptInvitation(user, projectId)
  }

  @Put(':projectId/cancel-invitation/:inviteeId')
  async cancelInvitation(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id'],
    @Param('inviteeId') inviteeId: User['id']
  ) {
    return await this.service.cancelInvitation(user, projectId, inviteeId)
  }

  @Put(':projectId/decline-invitation/:inviteeId')
  async declineInvitation(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id']
  ) {
    return await this.service.declineInvitation(user, projectId)
  }

  @Put(':projectId/leave')
  async leaveProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id']
  ) {
    return await this.service.leaveProject(user, projectId)
  }

  @Get(':projectId')
  async getProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id']
  ) {
    return await this.service.getProjectByUserAndId(user, projectId)
  }

  @Get()
  async getAllProjects(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return await this.service.getProjectsOfUser(
      user,
      page,
      limit,
      sort,
      order,
      search
    )
  }

  @Get(':projectId/members')
  async getMembersOfProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: Project['id'],
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return await this.service.getProjectMembers(
      user,
      projectId,
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
