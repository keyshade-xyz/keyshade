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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiTags
} from '@nestjs/swagger'
import { invalidAuthenticationResponse } from '../../common/static'

const apiKeySchemaWithValue = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    value: { type: 'string' },
    expiresAt: { type: 'string' },
    authorities: { type: 'array', items: { type: 'string' } },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' }
  }
}

const apiKeySchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    expiresAt: { type: 'string' },
    authorities: { type: 'array', items: { type: 'string' } },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' }
  }
}

@Controller('api-key')
@ApiBearerAuth()
@ApiSecurity('api_key')
@ApiTags('API Key Controller')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @RequiredApiKeyAuthorities(Authority.CREATE_API_KEY)
  @ApiOperation({
    summary: 'Create API key',
    description: 'This endpoint creates a new API key'
  })
  @ApiCreatedResponse({
    schema: apiKeySchemaWithValue,
    description: 'API key created successfully'
  })
  @ApiForbiddenResponse(invalidAuthenticationResponse)
  async createApiKey(@CurrentUser() user: User, @Body() dto: CreateApiKey) {
    return this.apiKeyService.createApiKey(user, dto)
  }

  @Put(':id')
  @RequiredApiKeyAuthorities(Authority.UPDATE_API_KEY)
  @ApiOperation({
    summary: 'Update API key',
    description: 'This endpoint updates an existing API key'
  })
  @ApiParam({
    name: 'id',
    description: 'API key ID',
    required: true,
    type: String
  })
  @ApiOkResponse({
    schema: apiKeySchema,
    description: 'API key updated successfully'
  })
  @ApiForbiddenResponse(invalidAuthenticationResponse)
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
  @ApiOperation({
    summary: 'Delete API key',
    description: 'This endpoint deletes an existing API key'
  })
  @ApiParam({
    name: 'id',
    description: 'API key ID',
    required: true,
    type: String
  })
  @ApiNoContentResponse({
    description: 'API key deleted successfully'
  })
  @ApiForbiddenResponse(invalidAuthenticationResponse)
  async deleteApiKey(@CurrentUser() user: User, @Param('id') id: string) {
    return this.apiKeyService.deleteApiKey(user, id)
  }

  @Get(':id')
  @RequiredApiKeyAuthorities(Authority.READ_API_KEY)
  @ApiOperation({
    summary: 'Get API key',
    description: 'This endpoint returns the details of an API key'
  })
  @ApiParam({
    name: 'id',
    description: 'API key ID',
    required: true,
    type: String
  })
  @ApiOkResponse({
    schema: apiKeySchemaWithValue,
    description: 'API key details'
  })
  @ApiForbiddenResponse(invalidAuthenticationResponse)
  async getApiKey(@CurrentUser() user: User, @Param('id') id: string) {
    return this.apiKeyService.getApiKeyById(user, id)
  }

  @Get('all')
  @RequiredApiKeyAuthorities(Authority.READ_API_KEY)
  @ApiOperation({
    summary: 'Get all API keys',
    description: 'This endpoint returns all API keys of the user'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
    example: 1,
    allowEmptyValue: false
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number,
    example: 10,
    allowEmptyValue: false
  })
  @ApiQuery({
    name: 'sort',
    description: 'Sort by field',
    required: false,
    type: String,
    example: 'name',
    allowEmptyValue: false
  })
  @ApiQuery({
    name: 'order',
    description: 'Sort order',
    required: false,
    type: String,
    example: 'asc',
    allowEmptyValue: false
  })
  @ApiQuery({
    name: 'search',
    description: 'Search by name',
    required: false,
    type: String,
    example: 'My API Key',
    allowEmptyValue: false
  })
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: apiKeySchema
    },
    description: 'API keys'
  })
  @ApiForbiddenResponse(invalidAuthenticationResponse)
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
}
