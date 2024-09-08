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

  @Post(':projectSlug')
  @RequiredApiKeyAuthorities(Authority.CREATE_SECRET)
  async createSecret(
    @CurrentUser() user: User,
    @Param('projectSlug') projectSlug: string,
    @Body() dto: CreateSecret
  ) {
    return await this.secretService.createSecret(user, dto, projectSlug)
  }

  @Put(':secretSlug')
  @RequiredApiKeyAuthorities(Authority.UPDATE_SECRET)
  async updateSecret(
    @CurrentUser() user: User,
    @Param('secretSlug') secretSlug: string,
    @Body() dto: UpdateSecret
  ) {
    return await this.secretService.updateSecret(user, secretSlug, dto)
  }

  @Put(':secretSlug/rollback/:rollbackVersion')
  @RequiredApiKeyAuthorities(Authority.UPDATE_SECRET)
  async rollbackSecret(
    @CurrentUser() user: User,
    @Param('secretSlug') secretSlug: string,
    @Query('environmentSlug') environmentSlug: string,
    @Param('rollbackVersion') rollbackVersion: number
  ) {
    return await this.secretService.rollbackSecret(
      user,
      secretSlug,
      environmentSlug,
      rollbackVersion
    )
  }

  @Delete(':secretSlug')
  @RequiredApiKeyAuthorities(Authority.DELETE_SECRET)
  async deleteSecret(
    @CurrentUser() user: User,
    @Param('secretSlug') secretSlug: string
  ) {
    return await this.secretService.deleteSecret(user, secretSlug)
  }

  @Get('/:projectSlug')
  @RequiredApiKeyAuthorities(Authority.READ_SECRET)
  async getAllSecretsOfProject(
    @CurrentUser() user: User,
    @Param('projectSlug') projectSlug: string,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = '',
    @Query('decryptValue') decryptValue: boolean = false
  ) {
    return await this.secretService.getAllSecretsOfProject(
      user,
      projectSlug,
      decryptValue,
      page,
      limit,
      sort,
      order,
      search
    )
  }

  @Get('/:projectSlug/:environmentSlug')
  @RequiredApiKeyAuthorities(Authority.READ_SECRET)
  async getAllSecretsOfEnvironment(
    @CurrentUser() user: User,
    @Param('projectSlug') projectSlug: string,
    @Param('environmentSlug') environmentSlug: string
  ) {
    return await this.secretService.getAllSecretsOfProjectAndEnvironment(
      user,
      projectSlug,
      environmentSlug
    )
  }
<<<<<<< HEAD

  @Get(':secretSlug/revisions/:environmentSlug')
  @RequiredApiKeyAuthorities(Authority.READ_SECRET)
  async getRevisionsOfSecret(
    @CurrentUser() user: User,
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
=======
>>>>>>> 6ac6f14 (Revert "Fix: merge conflicts")
}
