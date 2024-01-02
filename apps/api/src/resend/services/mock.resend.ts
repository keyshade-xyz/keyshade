/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common'
import { IResendService } from './resend.service.interface'
import { Resend } from 'resend'
import { $Enums } from '@prisma/client'

@Injectable()
export class MockResend implements IResendService {
  private readonly log = new Logger(MockResend.name)

  constructor() {
    // Check if resend is working
    new Resend('SOME KEY')
  }
  projectInvitationMailForRegisteredUser(
    email: string,
    project: string,
    actionUrl: string,
    invitee: string,
    role: $Enums.ProjectRole
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }

  projectInvitationMailForNonRegisteredUser(
    email: string,
    project: string,
    actionUrl: string,
    invitee: string,
    role: $Enums.ProjectRole
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    this.log.log(`OTP for ${email} is ${otp}`)
  }
}
