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
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'
import { Authority } from '@prisma/client'
import { CurrentUser } from '@/decorators/user.decorator'
import { CreateVariable } from '../dto/create.variable/create.variable'
import { UpdateVariable } from '../dto/update.variable/update.variable'
import { AuthenticatedUser } from '@/user/user.types'

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
}
