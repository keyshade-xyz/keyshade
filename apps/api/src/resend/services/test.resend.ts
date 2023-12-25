import { Injectable, Logger } from '@nestjs/common'
import { IResendService } from './resend.service.interface'
import { Resend } from 'resend'

@Injectable()
export class TestResend implements IResendService {
  private readonly log = new Logger(TestResend.name)

  constructor() {
    // Check if resend is working
    new Resend('SOME KEY')
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    this.log.log(`OTP for ${email} is ${otp}`)
  }
}
