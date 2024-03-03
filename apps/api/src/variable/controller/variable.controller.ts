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
import { ApiTags } from '@nestjs/swagger'
import { VariableService } from '../service/variable.service'
import { RequiredApiKeyAuthorities } from '../../decorators/required-api-key-authorities.decorator'
import { Authority, User } from '@prisma/client'
import { CurrentUser } from '../../decorators/user.decorator'
import { CreateVariable } from '../dto/create.variable/create.variable'

@ApiTags('Variable Controller')
@Controller('variable')
export class VariableController {
  constructor(private readonly variableService: VariableService) {}

  @Post(':projectId')
  @RequiredApiKeyAuthorities(Authority.CREATE_VARIABLE)
  async createVariable(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Body() dto: CreateVariable,
    @Query('reason') reason: string
  ) {
    return await this.variableService.createVariable(
      user,
      dto,
      projectId,
      reason
    )
  }

  @Put(':variableId')
  @RequiredApiKeyAuthorities(Authority.UPDATE_VARIABLE)
  async updateVariable(
    @CurrentUser() user: User,
    @Param('variableId') variableId: string,
    @Body() dto: CreateVariable,
    @Query('reason') reason: string
  ) {
    return await this.variableService.updateVariable(
      user,
      variableId,
      dto,
      reason
    )
  }

  @Put(':variableId/environment/:environmentId')
  @RequiredApiKeyAuthorities(
    Authority.UPDATE_VARIABLE,
    Authority.READ_ENVIRONMENT
  )
  async updateVariableEnvironment(
    @CurrentUser() user: User,
    @Param('variableId') variableId: string,
    @Param('environmentId') environmentId: string,
    @Query('reason') reason: string
  ) {
    return await this.variableService.updateVariableEnvironment(
      user,
      variableId,
      environmentId,
      reason
    )
  }

  @Put(':variableId/rollback/:rollbackVersion')
  @RequiredApiKeyAuthorities(Authority.UPDATE_VARIABLE)
  async rollbackVariable(
    @CurrentUser() user: User,
    @Param('variableId') variableId: string,
    @Param('rollbackVersion') rollbackVersion: number,
    @Query('reason') reason: string
  ) {
    return await this.variableService.rollbackVariable(
      user,
      variableId,
      rollbackVersion,
      reason
    )
  }

  @Delete(':variableId')
  @RequiredApiKeyAuthorities(Authority.DELETE_VARIABLE)
  async deleteVariable(
    @CurrentUser() user: User,
    @Param('variableId') variableId: string,
    @Query('reason') reason: string
  ) {
    return await this.variableService.deleteVariable(user, variableId, reason)
  }

  @Get(':variableId')
  @RequiredApiKeyAuthorities(Authority.READ_VARIABLE)
  async getVariable(
    @CurrentUser() user: User,
    @Param('variableId') variableId: string
  ) {
    return await this.variableService.getVariableById(user, variableId)
  }

  @Get('/all/:projectId')
  @RequiredApiKeyAuthorities(Authority.READ_VARIABLE)
  async getAllVariablesOfProject(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return await this.variableService.getAllVariablesOfProject(
      user,
      projectId,
      page,
      limit,
      sort,
      order,
      search
    )
  }
}
