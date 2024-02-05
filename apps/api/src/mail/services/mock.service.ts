/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from '@nestjs/common'
import { IMailService } from './interface.service'
import { WorkspaceRole } from '@prisma/client'

export class MockMailService implements IMailService {
  private readonly log = new Logger(MockMailService.name)

  async workspaceInvitationMailForUsers(
    email: string,
    workspace: string,
    actionUrl: string,
    invitee: string,
    forRegisteredUser: boolean
  ): Promise<void> {
    this.log.log(
      forRegisteredUser
        ? `Workspace Invitation Mail for Registered User: ${email}, ${workspace}, ${actionUrl}, ${invitee}`
        : `Workspace Invitation Mail for Non Registered User: ${email}, ${workspace}, ${actionUrl}, ${invitee}`
    )
  }

  async adminUserCreateEmail(email: string): Promise<void> {
    this.log.log(`Create pAdmin User Email: ${email}`)
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    this.log.log(`OTP for ${email} is ${otp}`)
  }

  async accountLoginEmail(email: string): Promise<void> {
    this.log.log(`Account Login Email for ${email}`)
  }
}
