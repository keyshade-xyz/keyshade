import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common'
import { IntegrationService } from './integration.service'
import { CurrentUser } from '@/decorators/user.decorator'
import { CreateIntegration } from './dto/create.integration/create.integration'
import { Authority } from '@prisma/client'
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'
import { UpdateIntegration } from './dto/update.integration/update.integration'
import { AuthenticatedUser } from '@/user/user.types'

@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post(':workspaceSlug')
  @RequiredApiKeyAuthorities(
    Authority.CREATE_INTEGRATION,
    Authority.READ_WORKSPACE,
    Authority.READ_PROJECT,
    Authority.READ_ENVIRONMENT
  )
  async createIntegration(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateIntegration,
    @Param('workspaceSlug') workspaceSlug: string
  ) {
    return await this.integrationService.createIntegration(
      user,
      dto,
      workspaceSlug
    )
  }

  @Put(':integrationSlug')
  @RequiredApiKeyAuthorities(
    Authority.UPDATE_INTEGRATION,
    Authority.READ_PROJECT,
    Authority.READ_ENVIRONMENT
  )
  async updateIntegration(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateIntegration,
    @Param('integrationSlug') integrationSlug: string
  ) {
    return await this.integrationService.updateIntegration(
      user,
      dto,
      integrationSlug
    )
  }

  @Get(':integrationSlug')
  @RequiredApiKeyAuthorities(Authority.READ_INTEGRATION)
  async getIntegration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('integrationSlug') integrationSlug: string
  ) {
    return await this.integrationService.getIntegration(user, integrationSlug)
  }

  /* istanbul ignore next */
  @Get('all/:workspaceSlug')
  @RequiredApiKeyAuthorities(Authority.READ_INTEGRATION)
  async getAllIntegrations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: string,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return await this.integrationService.getAllIntegrationsOfWorkspace(
      user,
      workspaceSlug,
      page,
      limit,
      sort,
      order,
      search
    )
  }

  @Get(':integrationSlug/runs')
  @RequiredApiKeyAuthorities(Authority.READ_INTEGRATION)
  async getAllRunsOfIntegration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('integrationSlug') integrationSlug: string,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10
  ) {
    return await this.integrationService.getAllRunsOfIntegration(
      user,
      integrationSlug,
      page,
      limit
    )
  }

  @Delete(':integrationSlug')
  @RequiredApiKeyAuthorities(Authority.DELETE_INTEGRATION)
  async deleteIntegration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('integrationSlug') integrationSlug: string
  ) {
    return await this.integrationService.deleteIntegration(
      user,
      integrationSlug
    )
  }

  @Post(':workspaceSlug/test')
  @HttpCode(HttpStatus.OK)
  @RequiredApiKeyAuthorities(
    Authority.CREATE_INTEGRATION,
    Authority.READ_WORKSPACE,
    Authority.READ_PROJECT,
    Authority.READ_ENVIRONMENT
  )
  async testIntegration(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateIntegration,
    @Param('workspaceSlug') workspaceSlug: string,
    @Query('privateKey') privateKey: string
  ) {
    return await this.integrationService.testIntegration(
      user,
      dto,
      workspaceSlug,
      privateKey
    )
  }
}
