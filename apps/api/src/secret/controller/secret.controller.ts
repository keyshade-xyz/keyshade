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
import { SecretService } from '../service/secret.service'
import { CurrentUser } from '@/decorators/user.decorator'
import { Authority, User } from '@prisma/client'
import { CreateSecret } from '../dto/create.secret/create.secret'
import { UpdateSecret } from '../dto/update.secret/update.secret'
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'

@Controller('secret')
export class SecretController {
  constructor(private readonly secretService: SecretService) {}

  @Post(':projectId')
  @RequiredApiKeyAuthorities(Authority.CREATE_SECRET)
  async createSecret(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Body() dto: CreateSecret
  ) {
    return await this.secretService.createSecret(user, dto, projectId)
  }

  @Put(':secretId')
  @RequiredApiKeyAuthorities(Authority.UPDATE_SECRET)
  async updateSecret(
    @CurrentUser() user: User,
    @Param('secretId') secretId: string,
    @Body() dto: UpdateSecret
  ) {
    return await this.secretService.updateSecret(user, secretId, dto)
  }

  @Put(':secretId/rollback/:rollbackVersion')
  @RequiredApiKeyAuthorities(Authority.UPDATE_SECRET)
  async rollbackSecret(
    @CurrentUser() user: User,
    @Param('secretId') secretId: string,
    @Query('environmentId') environmentId: string,
    @Param('rollbackVersion') rollbackVersion: number
  ) {
    return await this.secretService.rollbackSecret(
      user,
      secretId,
      environmentId,
      rollbackVersion
    )
  }

  @Delete(':secretId')
  @RequiredApiKeyAuthorities(Authority.DELETE_SECRET)
  async deleteSecret(
    @CurrentUser() user: User,
    @Param('secretId') secretId: string
  ) {
    return await this.secretService.deleteSecret(user, secretId)
  }

  @Get('/:projectId')
  @RequiredApiKeyAuthorities(Authority.READ_SECRET)
  async getAllSecretsOfProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = '',
    @Query('decryptValue') decryptValue: boolean = false
  ) {
    return await this.secretService.getAllSecretsOfProject(
      user,
      projectId,
      decryptValue,
      page,
      limit,
      sort,
      order,
      search
    )
  }

  @Get('/:projectId/:environmentId')
  @RequiredApiKeyAuthorities(Authority.READ_SECRET)
  async getAllSecretsOfEnvironment(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Param('environmentId') environmentId: string
  ) {
    return await this.secretService.getAllSecretsOfProjectAndEnvironment(
      user,
      projectId,
      environmentId
    )
  }

  @Get(':secretId/revisions/:environmentId')
  @RequiredApiKeyAuthorities(Authority.READ_SECRET)
  async getRevisionsOfSecret(
    @CurrentUser() user: User,
    @Param('secretId') secretId: string,
    @Param('environmentId') environmentId: string,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('order') order: string = 'desc'
  ) {
    return await this.secretService.getRevisionsOfSecret(
      user,
      secretId,
      environmentId,
      page,
      limit,
      order
    )
  }
}
