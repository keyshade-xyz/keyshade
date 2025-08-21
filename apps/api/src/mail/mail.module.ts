import { Global, Module } from '@nestjs/common'
import { MailService } from './services/mail.service'
import { MAIL_SERVICE } from './services/interface.service'
import { MockMailService } from '@/mail/services/mock.service'

@Global()
@Module({
  providers: [
    {
      provide: MAIL_SERVICE,
      useClass:
        // @ts-expect-error -- no reason
        process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'e2e'
          ? MockMailService
          : MailService
    }
  ],
  exports: [
    {
      provide: MAIL_SERVICE,
      useClass:
        // @ts-expect-error -- no reason
        process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'e2e'
          ? MockMailService
          : MailService
    }
  ]
})
export class MailModule {}
