import { Controller, Delete, Get, Param } from '@nestjs/common'
import { CliSessionService } from '@/session/service/cli-session.service'
import { CurrentUser } from '@/decorators/user.decorator'
import { AuthenticatedUser } from '@/user/user.types'
import { CliSession } from '@prisma/client'

@Controller('session/cli')
export class CliSessionController {
  constructor(private readonly cliSessionService: CliSessionService) {}

  @Get('all')
  public async getAllSessionsOfUser(@CurrentUser() user: AuthenticatedUser) {
    return await this.cliSessionService.getAllSessionsOfUser(user)
  }

  @Delete('revoke/:sessionId')
  public async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: CliSession['id']
  ) {
    return await this.cliSessionService.revokeSession(user, sessionId)
  }
}
