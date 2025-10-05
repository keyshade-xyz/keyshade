import { Controller, Delete, Get, Param } from '@nestjs/common'
import { CurrentUser } from '@/decorators/user.decorator'
import { AuthenticatedUser } from '@/user/user.types'
import { UserSessionService } from '@/session/service/user-session.service'
import { UserSession } from '@prisma/client'

@Controller('session/user')
export class UserSessionController {
  constructor(private readonly userSessionService: UserSessionService) {}

  @Get('all')
  public async getAllSessionsOfUser(@CurrentUser() user: AuthenticatedUser) {
    return await this.userSessionService.getAllSessionsOfUser(user)
  }

  @Delete('revoke/:sessionId')
  public async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: UserSession['id']
  ) {
    return await this.userSessionService.revokeSession(user, sessionId)
  }
}
