import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common'
import { ApiKeyService } from '../service/api-key.service'
import { CurrentUser } from '../../decorators/user.decorator'
import { CreateApiKey } from '../dto/create.api-key/create.api-key'
import { UpdateApiKey } from '../dto/update.api-key/update.api-key'
import { Authority, User } from '@prisma/client'
import { RequiredApiKeyAuthorities } from '../../decorators/required-api-key-authorities.decorator'

@Controller('api-key')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @RequiredApiKeyAuthorities(Authority.CREATE_API_KEY)
  async createApiKey(@CurrentUser() user: User, @Body() dto: CreateApiKey) {
    return this.apiKeyService.createApiKey(user, dto)
  }

  @Put(':id')
  @RequiredApiKeyAuthorities(Authority.UPDATE_API_KEY)
  async updateApiKey(
    @CurrentUser() user: User,
    @Body() dto: UpdateApiKey,
    @Param('id') id: string
  ) {
    return this.apiKeyService.updateApiKey(user, id, dto)
  }

  @Delete(':id')
  @RequiredApiKeyAuthorities(Authority.DELETE_API_KEY)
  @HttpCode(204)
  async deleteApiKey(@CurrentUser() user: User, @Param('id') id: string) {
    return this.apiKeyService.deleteApiKey(user, id)
  }

  @Get('/')
  @RequiredApiKeyAuthorities(Authority.READ_API_KEY)
  async getApiKeysOfUser(
    @CurrentUser() user: User,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return this.apiKeyService.getAllApiKeysOfUser(
      user,
      page,
      limit,
      sort,
      order,
      search
    )
  }

  @Get(':id')
  @RequiredApiKeyAuthorities(Authority.READ_API_KEY)
  async getApiKey(@CurrentUser() user: User, @Param('id') id: string) {
    return this.apiKeyService.getApiKeyById(user, id)
  }

  @Get('/access/live-updates')
  @RequiredApiKeyAuthorities(
    Authority.READ_SECRET,
    Authority.READ_VARIABLE,
    Authority.READ_ENVIRONMENT,
    Authority.READ_PROJECT,
    Authority.READ_WORKSPACE
  )
  async canAccessLiveUpdates() {
    return {
      canAccessLiveUpdates: true
    }
  }
}
