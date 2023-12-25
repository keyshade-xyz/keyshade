import { Global, Module } from '@nestjs/common'
import { MailResend } from './services/mail.resend'
import { RESEND_SERVICE } from './services/resend.service.interface'
import { TestResend } from './services/test.resend'

const customProvider = {
  provide: RESEND_SERVICE,
  useClass: process.env.NODE_ENV === 'development' ? MailResend : TestResend
}

@Global()
@Module({
  providers: [MailResend, TestResend, customProvider],
  exports: [customProvider, MailResend, TestResend]
})
export class ResendModule {}
