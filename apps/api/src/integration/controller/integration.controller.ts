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
import { IntegrationService } from '../service/integration.service'
import { CurrentUser } from '@/decorators/user.decorator'
import { CreateIntegration } from '../dto/create.integration/create.integration'
import { Authority, User } from '@prisma/client'
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'
import { UpdateIntegration } from '../dto/update.integration/update.integration'

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
    @CurrentUser() user: User,
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
    @CurrentUser() user: User,
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
    @CurrentUser() user: User,
    @Param('integrationSlug') integrationSlug: string
  ) {
    return await this.integrationService.getIntegration(user, integrationSlug)
  }

  /* istanbul ignore next */
<<<<<<< HEAD
  @Get('all/:workspaceSlug')
  @RequiredApiKeyAuthorities(Authority.READ_INTEGRATION)
  async getAllIntegrations(
    @CurrentUser() user: User,
    @Param('workspaceSlug') workspaceSlug: string,
    @Query('page') page: number = 0,
=======
  // The e2e tests are not working, but the API calls work as expected
  @Get('all/:workspaceId')
  @RequiredApiKeyAuthorities(Authority.READ_INTEGRATION)
  async getAllIntegrations(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Query('page') page: number = 1,
>>>>>>> 6ac6f14 (Revert "Fix: merge conflicts")
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

  @Delete(':integrationSlug')
  @RequiredApiKeyAuthorities(Authority.DELETE_INTEGRATION)
  async deleteIntegration(
    @CurrentUser() user: User,
    @Param('integrationSlug') integrationSlug: string
  ) {
    return await this.integrationService.deleteIntegration(
      user,
      integrationSlug
    )
  }
}
