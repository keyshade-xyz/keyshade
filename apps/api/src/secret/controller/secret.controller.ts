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
import { SecretService } from '../service/secret.service'
import { CurrentUser } from '../../decorators/user.decorator'
import { Authority, User } from '@prisma/client'
import { CreateSecret } from '../dto/create.secret/create.secret'
import { UpdateSecret } from '../dto/update.secret/update.secret'
import { AdminGuard } from '../../auth/guard/admin/admin.guard'
import { ApiTags } from '@nestjs/swagger'
import { RequiredApiKeyAuthorities } from '../../decorators/required-api-key-authorities.decorator'

@ApiTags('Secret Controller')
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

  @Put(':secretId/environment/:environmentId')
  @RequiredApiKeyAuthorities(
    Authority.UPDATE_SECRET,
    Authority.READ_ENVIRONMENT
  )
  async updateSecretEnvironment(
    @CurrentUser() user: User,
    @Param('secretId') secretId: string,
    @Param('environmentId') environmentId: string
  ) {
    return await this.secretService.updateSecretEnvironment(
      user,
      secretId,
      environmentId
    )
  }

  @Put(':secretId/rollback/:rollbackVersion')
  @RequiredApiKeyAuthorities(Authority.UPDATE_SECRET)
  async rollbackSecret(
    @CurrentUser() user: User,
    @Param('secretId') secretId: string,
    @Param('rollbackVersion') rollbackVersion: number
  ) {
    return await this.secretService.rollbackSecret(
      user,
      secretId,
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

  @Get(':secretId')
  @RequiredApiKeyAuthorities(Authority.READ_SECRET)
  async getSecret(
    @CurrentUser() user: User,
    @Param('secretId') secretId: string,
    @Query('decryptValue') decryptValue: boolean = false
  ) {
    return await this.secretService.getSecretById(user, secretId, decryptValue)
  }

  @Get(':secretId/versions')
  @RequiredApiKeyAuthorities(Authority.READ_SECRET)
  async getAllVersionsOfSecret(
    @CurrentUser() user: User,
    @Param('secretId') secretId: string
  ) {
    return await this.secretService.getAllVersionsOfSecret(user, secretId)
  }

  @Get('/all/:projectId')
  @RequiredApiKeyAuthorities(Authority.READ_SECRET)
  async getAllSecretsOfProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Query('page') page: number = 1,
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

  @UseGuards(AdminGuard)
  @Get()
  async getAllSecrets(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return await this.secretService.getAllSecrets(
      page,
      limit,
      sort,
      order,
      search
    )
  }
}
