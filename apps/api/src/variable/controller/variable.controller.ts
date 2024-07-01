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
import { VariableService } from '../service/variable.service'
import { RequiredApiKeyAuthorities } from '../../decorators/required-api-key-authorities.decorator'
import { Authority, User } from '@prisma/client'
import { CurrentUser } from '../../decorators/user.decorator'
import { CreateVariable } from '../dto/create.variable/create.variable'
import { UpdateVariable } from '../dto/update.variable/update.variable'

@Controller('variable')
export class VariableController {
  constructor(private readonly variableService: VariableService) {}

  @Post(':projectId')
  @RequiredApiKeyAuthorities(Authority.CREATE_VARIABLE)
  async createVariable(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Body() dto: CreateVariable
  ) {
    return await this.variableService.createVariable(user, dto, projectId)
  }

  @Put(':variableId')
  @RequiredApiKeyAuthorities(Authority.UPDATE_VARIABLE)
  async updateVariable(
    @CurrentUser() user: User,
    @Param('variableId') variableId: string,
    @Body() dto: UpdateVariable
  ) {
    return await this.variableService.updateVariable(user, variableId, dto)
  }

  @Put(':variableId/rollback/:rollbackVersion')
  @RequiredApiKeyAuthorities(Authority.UPDATE_VARIABLE)
  async rollbackVariable(
    @CurrentUser() user: User,
    @Param('variableId') variableId: string,
    @Query('environmentId') environmentId: string,
    @Param('rollbackVersion') rollbackVersion: number
  ) {
    return await this.variableService.rollbackVariable(
      user,
      variableId,
      environmentId,
      rollbackVersion
    )
  }

  @Delete(':variableId')
  @RequiredApiKeyAuthorities(Authority.DELETE_VARIABLE)
  async deleteVariable(
    @CurrentUser() user: User,
    @Param('variableId') variableId: string
  ) {
    return await this.variableService.deleteVariable(user, variableId)
  }

  @Get('/:projectId')
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

  @Get('/:projectId/:environmentId')
  @RequiredApiKeyAuthorities(Authority.READ_VARIABLE)
  async getAllVariablesOfEnvironment(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Param('environmentId') environmentId: string
  ) {
    return await this.variableService.getAllVariablesOfProjectAndEnvironment(
      user,
      projectId,
      environmentId
    )
  }

  @Get('/:variableId/revisions/:environmentId')
  @RequiredApiKeyAuthorities(Authority.READ_VARIABLE)
  async getRevisionsOfVariable(
    @CurrentUser() user: User,
    @Param('variableId') variableId: string,
    @Param('environmentId') environmentId: string,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('order') order: 'asc' | 'desc' = 'asc'
  ) {
    return await this.variableService.getRevisionsOfVariable(
      user,
      variableId,
      environmentId,
      page,
      limit,
      order
    )
  }
}
