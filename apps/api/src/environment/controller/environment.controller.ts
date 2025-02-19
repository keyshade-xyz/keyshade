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
import { CurrentUser } from '@/decorators/user.decorator'
import { CreateEnvironment } from '../dto/create.environment/create.environment'
import { Authority } from '@prisma/client'
import { UpdateEnvironment } from '../dto/update.environment/update.environment'
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'
import { AuthenticatedUser } from '@/user/user.types'

@Controller('environment')
export class EnvironmentController {
  constructor(private readonly environmentService: EnvironmentService) {}

  @Post(':projectSlug')
  @RequiredApiKeyAuthorities(Authority.CREATE_ENVIRONMENT)
  async createEnvironment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEnvironment,
    @Param('projectSlug') projectSlug: string
  ) {
    return await this.environmentService.createEnvironment(
      user,
      dto,
      projectSlug
    )
  }

  @Put(':environmentSlug')
  @RequiredApiKeyAuthorities(Authority.UPDATE_ENVIRONMENT)
  async updateEnvironment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateEnvironment,
    @Param('environmentSlug') environmentSlug: string
  ) {
    return await this.environmentService.updateEnvironment(
      user,
      dto,
      environmentSlug
    )
  }

  @Get(':environmentSlug')
  @RequiredApiKeyAuthorities(Authority.READ_ENVIRONMENT)
  async getEnvironment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('environmentSlug') environmentSlug: string
  ) {
    return await this.environmentService.getEnvironment(user, environmentSlug)
  }

  @Get('/all/:projectSlug')
  @RequiredApiKeyAuthorities(Authority.READ_ENVIRONMENT)
  async getEnvironmentsOfProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectSlug') projectSlug: string,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return await this.environmentService.getEnvironmentsOfProject(
      user,
      projectSlug,
      page,
      limit,
      sort,
      order,
      search
    )
  }

  @Delete(':environmentSlug')
  @RequiredApiKeyAuthorities(Authority.DELETE_ENVIRONMENT)
  async deleteEnvironment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('environmentSlug') environmentSlug: string
  ) {
    return await this.environmentService.deleteEnvironment(
      user,
      environmentSlug
    )
  }
}
