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
import { SecretService } from './secret.service'
import { CurrentUser } from '@/decorators/user.decorator'
import { Authority } from '@prisma/client'
import { CreateSecret } from './dto/create.secret/create.secret'
import { UpdateSecret } from './dto/update.secret/update.secret'
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'
import { AuthenticatedUser } from '@/user/user.types'

@Controller('secret')
export class SecretController {
  constructor(private readonly secretService: SecretService) {}

  @Post(':projectSlug')
  @RequiredApiKeyAuthorities(Authority.CREATE_SECRET)
  async createSecret(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectSlug') projectSlug: string,
    @Body() dto: CreateSecret
  ) {
    return await this.secretService.createSecret(user, dto, projectSlug)
  }

  @Put(':secretSlug')
  @RequiredApiKeyAuthorities(Authority.UPDATE_SECRET)
  async updateSecret(
    @CurrentUser() user: AuthenticatedUser,
    @Param('secretSlug') secretSlug: string,
    @Body() dto: UpdateSecret
  ) {
    return await this.secretService.updateSecret(user, secretSlug, dto)
  }

  @Put(':secretSlug/rollback/:rollbackVersion')
  @RequiredApiKeyAuthorities(Authority.UPDATE_SECRET)
  async rollbackSecret(
    @CurrentUser() user: AuthenticatedUser,
    @Param('secretSlug') secretSlug: string,
    @Param('rollbackVersion') rollbackVersion: number,
    @Query('environmentSlug') environmentSlug: string
  ) {
    return await this.secretService.rollbackSecret(
      user,
      secretSlug,
      environmentSlug,
      rollbackVersion
    )
  }

  @Delete(':secretSlug/:environmentSlug')
  @RequiredApiKeyAuthorities(Authority.UPDATE_SECRET)
  async deleteEnvironmentValueOfSecret(
    @CurrentUser() user: AuthenticatedUser,
    @Param('secretSlug') secretSlug: string,
    @Param('environmentSlug') environmentSlug: string
  ) {
    return await this.secretService.deleteEnvironmentValueOfSecret(
      user,
      secretSlug,
      environmentSlug
    )
  }

  @Delete(':secretSlug')
  @RequiredApiKeyAuthorities(Authority.DELETE_SECRET)
  async deleteSecret(
    @CurrentUser() user: AuthenticatedUser,
    @Param('secretSlug') secretSlug: string
  ) {
    return await this.secretService.deleteSecret(user, secretSlug)
  }

  @Get('/:projectSlug')
  @RequiredApiKeyAuthorities(Authority.READ_SECRET)
  async getAllSecretsOfProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectSlug') projectSlug: string,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return await this.secretService.getAllSecretsOfProject(
      user,
      projectSlug,
      page,
      limit,
      sort,
      order,
      search
    )
  }

  @Get(':secretSlug/revisions/:environmentSlug')
  @RequiredApiKeyAuthorities(Authority.READ_SECRET)
  async getRevisionsOfSecret(
    @CurrentUser() user: AuthenticatedUser,
    @Param('secretSlug') secretSlug: string,
    @Param('environmentSlug') environmentSlug: string,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('order') order: 'asc' | 'desc' = 'desc'
  ) {
    return await this.secretService.getRevisionsOfSecret(
      user,
      secretSlug,
      environmentSlug,
      page,
      limit,
      order
    )
  }

  @Get('/:projectSlug/:environmentSlug')
  @RequiredApiKeyAuthorities(Authority.READ_SECRET)
  async getAllSecretsOfEnvironment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectSlug') projectSlug: string,
    @Param('environmentSlug') environmentSlug: string
  ) {
    return await this.secretService.getAllSecretsOfProjectAndEnvironment(
      user,
      projectSlug,
      environmentSlug
    )
  }
}
