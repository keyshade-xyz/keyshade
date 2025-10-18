import { Module } from '@nestjs/common'
import { CliSessionController } from '@/session/controller/cli-session.controller'
import { CliSessionService } from '@/session/service/cli-session.service'
import { BrowserSessionController } from '@/session/controller/browser-session.controller'
import { BrowserSessionService } from '@/session/service/browser-session.service'

@Module({
  controllers: [BrowserSessionController, CliSessionController],
  providers: [BrowserSessionService, CliSessionService]
})
export class SessionModule {}
