import { Global, Module } from '@nestjs/common'
import { MailService } from './services/mail.nodemailer'
import { MAIL_SERVICE } from './services/mail.service.interface'
import { TestMail } from './services/fake.mail'

const customProvider = {
  provide: MAIL_SERVICE,
  useClass: process.env.NODE_ENV === 'development' ? MailService : TestMail
}

@Global()
@Module({
  providers: [MailService, customProvider, TestMail],
  exports: [customProvider, MailService, TestMail]
})
export class MailModule {}
