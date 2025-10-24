import { Controller, Delete, Get, Param } from '@nestjs/common'
import { CurrentUser } from '@/decorators/user.decorator'
import { AuthenticatedUser } from '@/user/user.types'
import { BrowserSessionService } from '@/session/service/browser-session.service'
import { BrowserSession } from '@prisma/client'

@Controller('session/browser')
export class BrowserSessionController {
  constructor(private readonly browserSessionService: BrowserSessionService) {}

  @Get('all')
  public async getAllBrowserSessions(@CurrentUser() user: AuthenticatedUser) {
    return await this.browserSessionService.getAllBrowserSessions(user)
  }

  @Delete('revoke/:sessionId')
  public async revokeBrowserSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: BrowserSession['id']
  ) {
    return await this.browserSessionService.revokeBrowserSession(
      user,
      sessionId
    )
  }
}
