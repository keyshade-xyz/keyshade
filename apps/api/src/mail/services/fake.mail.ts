import { Injectable, Logger } from '@nestjs/common'
import { IMailService } from './mail.service.interface'

@Injectable()
export class TestMail implements IMailService {
  private readonly log = new Logger(TestMail.name)

  async sendOtp(email: string, otp: string): Promise<void> {
    this.log.log(`OTP for ${email} is ${otp}`)
  }
}
