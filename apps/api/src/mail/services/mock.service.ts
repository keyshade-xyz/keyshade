/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from '@nestjs/common'
import { IMailService } from './interface.service'

export class MockMailService implements IMailService {
  private readonly log = new Logger(MockMailService.name)

  async invitedToWorkspace(
    email: string,
    workspaceName: string,
    actionUrl: string,
    invitedBy: string,
    invitedOn: string,
    forRegisteredUser: boolean
  ): Promise<void> {
    this.log.log(
      forRegisteredUser
        ? `User ${email} has been invited to the workspace ${workspaceName} by ${invitedBy} on ${invitedOn}. Invitation details can be accessed at ${actionUrl}.`
        : `User ${email} has been invited to the workspace ${workspaceName} by ${invitedBy} on ${invitedOn}. Since the user is not registered, they can sign up and access the invitation details at ${actionUrl}.`
    )
  }

  async adminUserCreateEmail(email: string): Promise<void> {
    this.log.log(`Create pAdmin User Email: ${email}`)
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    this.log.log(`OTP for ${email} is ${otp}`)
  }

  async accountLoginEmail(
    email: string,
    username: string,
    actionUrl: string
  ): Promise<void> {
    this.log.log(
      `Account Login Email for ${email}, username ${username} and action URL ${actionUrl}`
    )
  }

  async feedbackEmail(email: string, feedback: string): Promise<void> {
    this.log.log(`Feedback is : ${feedback}, for email : ${email}`)
  }

  async sendEmailChangedOtp(email: string, otp: string): Promise<void> {
    this.log.log(`Email change OTP for email ${email} is ${otp}`)
  }

  async removedFromWorkspace(
    email: string,
    workspaceName: string,
    removedOn: Date
  ): Promise<void> {
    this.log.log(
      `User with email ${email} has been removed from the workspace ${workspaceName} on ${removedOn.toISOString()}`
    )
  }

  async sendLoginNotification(
    email: string,
    data: { ip: string; userAgent: string; location?: string }
  ): Promise<void> {
    this.log.log(
      `[MOCK] Login notification would be sent to ${email}: IP=${data.ip}, Location=${data.location}, UserAgent=${data.userAgent}`
    )
  }
}
