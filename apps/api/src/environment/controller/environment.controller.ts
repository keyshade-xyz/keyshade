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
import { EnvironmentService } from '../service/environment.service'
import { CurrentUser } from '../../decorators/user.decorator'
import { CreateEnvironment } from '../dto/create.environment/create.environment'
import { Authority, User } from '@prisma/client'
import { UpdateEnvironment } from '../dto/update.environment/update.environment'
import { RequiredApiKeyAuthorities } from '../../decorators/required-api-key-authorities.decorator'
import { AlphanumericReasonValidationPipe } from '../../common/alphanumeric-reason-pipe'

@Controller('environment')
export class EnvironmentController {
  constructor(private readonly environmentService: EnvironmentService) {}

  @Post(':projectId')
  @RequiredApiKeyAuthorities(Authority.CREATE_ENVIRONMENT)
  async createEnvironment(
    @CurrentUser() user: User,
    @Body() dto: CreateEnvironment,
    @Param('projectId') projectId: string,
    @Query('reason', AlphanumericReasonValidationPipe) reason: string
  ) {
    return await this.environmentService.createEnvironment(
      user,
      dto,
      projectId,
      reason
    )
  }

  @Put(':environmentId')
  @RequiredApiKeyAuthorities(Authority.UPDATE_ENVIRONMENT)
  async updateEnvironment(
    @CurrentUser() user: User,
    @Body() dto: UpdateEnvironment,
    @Param('environmentId') environmentId: string,
    @Query('reason', AlphanumericReasonValidationPipe) reason: string
  ) {
    return await this.environmentService.updateEnvironment(
      user,
      dto,
      environmentId,
      reason
    )
  }

  @Get(':environmentId')
  @RequiredApiKeyAuthorities(Authority.READ_ENVIRONMENT)
  async getEnvironment(
    @CurrentUser() user: User,
    @Param('environmentId') environmentId: string
  ) {
    return await this.environmentService.getEnvironment(user, environmentId)
  }

  @Get('/all/:projectId')
  @RequiredApiKeyAuthorities(Authority.READ_ENVIRONMENT)
  async getEnvironmentsOfProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return await this.environmentService.getEnvironmentsOfProject(
      user,
      projectId,
      page,
      limit,
      sort,
      order,
      search
    )
  }

  @Delete(':environmentId')
  @RequiredApiKeyAuthorities(Authority.DELETE_ENVIRONMENT)
  async deleteEnvironment(
    @CurrentUser() user: User,
    @Param('environmentId') environmentId: string,
    @Query('reason', AlphanumericReasonValidationPipe) reason: string
  ) {
    return await this.environmentService.deleteEnvironment(
      user,
      environmentId,
      reason
    )
  }
}
