import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { PersonalAccessTokenService } from '@/user/service/personal-access-token.service'
import { AuthenticatedUserContext } from '@/auth/auth.types'
import { CreatePatDto } from '@/user/dto/create.pat/create.pat'
import { PersonalAccessTokenResponse } from '@/user/user.types'
import { CurrentUser } from '@/decorators/user.decorator'
import { PersonalAccessToken } from '@prisma/client'
import { UpdatePatDto } from '@/user/dto/update.pat/update.pat'

@Controller('user/personal-access-token')
export class PersonalAccessTokenController {
  constructor(
    private readonly personalAccessTokenService: PersonalAccessTokenService
  ) {}

  @Post()
  async createPersonalAccessToken(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() dto: CreatePatDto
  ): Promise<PersonalAccessTokenResponse> {
    return this.personalAccessTokenService.createPersonalAccessToken(user, dto)
  }

  @Put(':tokenId')
  async updatePersonalAccessToken(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('tokenId') tokenId: PersonalAccessToken['id'],
    @Body() dto: UpdatePatDto
  ): Promise<PersonalAccessTokenResponse> {
    return this.personalAccessTokenService.updatePersonalAccessToken(
      user,
      tokenId,
      dto
    )
  }

  @Put(':tokenId/regenerate')
  async regeneratePersonalAccessToken(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('tokenId') tokenId: PersonalAccessToken['id']
  ): Promise<PersonalAccessTokenResponse> {
    return this.personalAccessTokenService.regeneratePersonalAccessToken(
      user,
      tokenId
    )
  }

  @Get('/all')
  async getAllPersonalAccessTokens(
    @CurrentUser() user: AuthenticatedUserContext
  ): Promise<PersonalAccessTokenResponse[]> {
    return this.personalAccessTokenService.getAllPersonalAccessTokens(user)
  }

  @Delete(':tokenId')
  async revokePersonalAccessToken(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('tokenId') tokenId: PersonalAccessToken['id']
  ): Promise<void> {
    return this.personalAccessTokenService.revokePersonalAccessToken(
      user,
      tokenId
    )
  }
}
