import { Global, Module } from '@nestjs/common'
import { MailResend } from './services/mail.resend'
import { RESEND_SERVICE } from './services/resend.service.interface'
import { MockResend } from './services/mock.resend'

const customProvider = {
  provide: RESEND_SERVICE,
  useClass: process.env.NODE_ENV === 'test' ? MockResend : MailResend
}

@Global()
@Module({
  providers: [MailResend, MockResend, customProvider],
  exports: [customProvider, MailResend, MockResend]
})
export class ResendModule {}
