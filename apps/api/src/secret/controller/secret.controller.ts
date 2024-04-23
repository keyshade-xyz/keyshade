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
import { CurrentUser } from '../../decorators/user.decorator'
import { Authority, User } from '@prisma/client'
import { CreateSecret } from '../dto/create.secret/create.secret'
import { UpdateSecret } from '../dto/update.secret/update.secret'
import { ApiTags } from '@nestjs/swagger'
import { RequiredApiKeyAuthorities } from '../../decorators/required-api-key-authorities.decorator'
import { AlphanumericReasonValidationPipe } from '../../common/alphanumeric-reason-pipe'

@ApiTags('Secret Controller')
@Controller('secret')
export class SecretController {
  constructor(private readonly secretService: SecretService) {}

  @Post(':projectId')
  @RequiredApiKeyAuthorities(Authority.CREATE_SECRET)
  async createSecret(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Body() dto: CreateSecret,
    @Query('reason', AlphanumericReasonValidationPipe) reason: string
  ) {
    return await this.secretService.createSecret(user, dto, projectId, reason)
  }

  @Put(':secretId')
  @RequiredApiKeyAuthorities(Authority.UPDATE_SECRET)
  async updateSecret(
    @CurrentUser() user: User,
    @Param('secretId') secretId: string,
    @Body() dto: UpdateSecret,
    @Query('reason', AlphanumericReasonValidationPipe) reason: string
  ) {
    return await this.secretService.updateSecret(user, secretId, dto, reason)
  }

  @Put(':secretId/environment/:environmentId')
  @RequiredApiKeyAuthorities(
    Authority.UPDATE_SECRET,
    Authority.READ_ENVIRONMENT
  )
  async updateSecretEnvironment(
    @CurrentUser() user: User,
    @Param('secretId') secretId: string,
    @Param('environmentId') environmentId: string,
    @Query('reason', AlphanumericReasonValidationPipe) reason: string
  ) {
    return await this.secretService.updateSecretEnvironment(
      user,
      secretId,
      environmentId,
      reason
    )
  }

  @Put(':secretId/rollback/:rollbackVersion')
  @RequiredApiKeyAuthorities(Authority.UPDATE_SECRET)
  async rollbackSecret(
    @CurrentUser() user: User,
    @Param('secretId') secretId: string,
    @Param('rollbackVersion') rollbackVersion: number,
    @Query('reason', AlphanumericReasonValidationPipe) reason: string
  ) {
    return await this.secretService.rollbackSecret(
      user,
      secretId,
      rollbackVersion,
      reason
    )
  }

  @Delete(':secretId')
  @RequiredApiKeyAuthorities(Authority.DELETE_SECRET)
  async deleteSecret(
    @CurrentUser() user: User,
    @Param('secretId') secretId: string,
    @Query('reason', AlphanumericReasonValidationPipe) reason: string
  ) {
    return await this.secretService.deleteSecret(user, secretId, reason)
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

  @Get('/all/:projectId')
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
}
