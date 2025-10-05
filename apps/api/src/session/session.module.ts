import { Module } from '@nestjs/common'
import { UserSessionController } from '@/session/controller/user-session.controller'
import { CliSessionController } from '@/session/controller/cli-session.controller'
import { UserSessionService } from '@/session/service/user-session.service'
import { CliSessionService } from '@/session/service/cli-session.service'

@Module({
  controllers: [UserSessionController, CliSessionController],
  providers: [UserSessionService, CliSessionService]
})
export class SessionModule {}
