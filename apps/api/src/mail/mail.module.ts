import { Global, Module } from '@nestjs/common'
import { MailService } from './services/mail.service'
import { MAIL_SERVICE } from './services/interface.service'

@Global()
@Module({
  providers: [
    {
      provide: MAIL_SERVICE,
      useClass: MailService
    }
  ],
  exports: [
    {
      provide: MAIL_SERVICE,
      useClass: MailService
    }
  ]
})
export class MailModule {}
