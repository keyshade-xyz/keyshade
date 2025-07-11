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
import { VariableService } from './variable.service'
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'
import { Authority } from '@prisma/client'
import { CurrentUser } from '@/decorators/user.decorator'
import { CreateVariable } from './dto/create.variable/create.variable'
import { UpdateVariable } from './dto/update.variable/update.variable'
import { AuthenticatedUser } from '@/user/user.types'
import { BulkCreateVariableDto } from './dto/bulk.create.variable/bulk.create.variable'

@Controller('variable')
export class VariableController {
  constructor(private readonly variableService: VariableService) {}

  @Post(':projectSlug')
  @RequiredApiKeyAuthorities(Authority.CREATE_VARIABLE)
  async createVariable(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectSlug') projectSlug: string,
    @Body() dto: CreateVariable
  ) {
    return await this.variableService.createVariable(user, dto, projectSlug)
  }

  @Post(':projectSlug/bulk')
  @RequiredApiKeyAuthorities(Authority.CREATE_VARIABLE)
  async bulkCreateVariables(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectSlug') projectSlug: string,
    @Body() dto: BulkCreateVariableDto
  ) {
    return await this.variableService.bulkCreateVariables(
      user,
      projectSlug,
      dto.variables
    )
  }

  @Put(':variableSlug')
  @RequiredApiKeyAuthorities(Authority.UPDATE_VARIABLE)
  async updateVariable(
    @CurrentUser() user: AuthenticatedUser,
    @Param('variableSlug') variableSlug: string,
    @Body() dto: UpdateVariable
  ) {
    return await this.variableService.updateVariable(user, variableSlug, dto)
  }

  @Put(':variableSlug/rollback/:rollbackVersion')
  @RequiredApiKeyAuthorities(Authority.UPDATE_VARIABLE)
  async rollbackVariable(
    @CurrentUser() user: AuthenticatedUser,
    @Param('variableSlug') variableSlug: string,
    @Query('environmentSlug') environmentSlug: string,
    @Param('rollbackVersion') rollbackVersion: number
  ) {
    return await this.variableService.rollbackVariable(
      user,
      variableSlug,
      environmentSlug,
      rollbackVersion
    )
  }

  @Put(':variableSlug/disable/:environmentSlug')
  @RequiredApiKeyAuthorities(Authority.UPDATE_VARIABLE)
  async disableVariable(
    @CurrentUser() user: AuthenticatedUser,
    @Param('variableSlug') variableSlug: string,
    @Param('environmentSlug') environmentSlug: string
  ) {
    return await this.variableService.disableVariable(
      user,
      variableSlug,
      environmentSlug
    )
  }

  @Put(':variableSlug/enable/:environmentSlug')
  @RequiredApiKeyAuthorities(Authority.UPDATE_VARIABLE)
  async enableVariable(
    @CurrentUser() user: AuthenticatedUser,
    @Param('variableSlug') variableSlug: string,
    @Param('environmentSlug') environmentSlug: string
  ) {
    return await this.variableService.enableVariable(
      user,
      variableSlug,
      environmentSlug
    )
  }

  @Delete(':variableSlug/:environmentSlug')
  @RequiredApiKeyAuthorities(Authority.UPDATE_VARIABLE)
  async deleteEnvironmentValueOfVariable(
    @CurrentUser() user: AuthenticatedUser,
    @Param('variableSlug') variableSlug: string,
    @Param('environmentSlug') environmentSlug: string
  ) {
    return await this.variableService.deleteEnvironmentValueOfVariable(
      user,
      variableSlug,
      environmentSlug
    )
  }

  @Delete(':variableSlug')
  @RequiredApiKeyAuthorities(Authority.DELETE_VARIABLE)
  async deleteVariable(
    @CurrentUser() user: AuthenticatedUser,
    @Param('variableSlug') variableSlug: string
  ) {
    return await this.variableService.deleteVariable(user, variableSlug)
  }

  @Get('/:projectSlug')
  @RequiredApiKeyAuthorities(Authority.READ_VARIABLE)
  async getAllVariablesOfProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectSlug') projectSlug: string,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'name',
    @Query('order') order: string = 'asc',
    @Query('search') search: string = ''
  ) {
    return await this.variableService.getAllVariablesOfProject(
      user,
      projectSlug,
      page,
      limit,
      sort,
      order,
      search
    )
  }

  @Get('/:variableSlug/revisions/:environmentSlug')
  @RequiredApiKeyAuthorities(Authority.READ_VARIABLE)
  async getRevisionsOfVariable(
    @CurrentUser() user: AuthenticatedUser,
    @Param('variableSlug') variableSlug: string,
    @Param('environmentSlug') environmentSlug: string,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('order') order: 'asc' | 'desc' = 'desc'
  ) {
    return await this.variableService.getRevisionsOfVariable(
      user,
      variableSlug,
      environmentSlug,
      page,
      limit,
      order
    )
  }

  @Get('/:projectSlug/:environmentSlug')
  @RequiredApiKeyAuthorities(Authority.READ_VARIABLE)
  async getAllVariablesOfEnvironment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectSlug') projectSlug: string,
    @Param('environmentSlug') environmentSlug: string
  ) {
    return await this.variableService.getAllVariablesOfProjectAndEnvironment(
      user,
      projectSlug,
      environmentSlug
    )
  }
}
