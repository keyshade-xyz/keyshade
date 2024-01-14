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
import { ApiKeyService } from '../service/api-key.service'
import { User } from '@prisma/client'
import { CurrentUser } from '../../decorators/user.decorator'
import { CreateApiKey } from '../dto/create.api-key/create.api-key'
import { UpdateApiKey } from '../dto/update.api-key/update.api-key'

@Controller('api-key')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get('permissable-scopes-of-projects')
  async getPermissableScopesOfProjects(@CurrentUser() user: User) {
    return this.apiKeyService.getPermissableScopesOfProjects(user)
  }

  @Post()
  async createApiKey(@CurrentUser() user: User, @Body() dto: CreateApiKey) {
    return this.apiKeyService.createApiKey(user, dto)
  }

  @Put(':id')
  async updateApiKey(
    @CurrentUser() user: User,
    @Body() dto: UpdateApiKey,
    @Param('id') id: string
  ) {
    return this.apiKeyService.updateApiKey(user, id, dto)
  }

  @Delete(':id')
  async deleteApiKey(@CurrentUser() user: User, @Param('id') id: string) {
    return this.apiKeyService.deleteApiKey(user, id)
  }

  @Get(':id')
  async getApiKey(@CurrentUser() user: User, @Param('id') id: string) {
    return this.apiKeyService.getApiKeyById(user, id)
  }

  @Get()
  async getApiKeys(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
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
}
