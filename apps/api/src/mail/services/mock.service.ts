/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from '@nestjs/common'
import { IMailService } from './interface.service'
import { WorkspaceRole } from '@prisma/client'

export class MockMailService implements IMailService {
  private readonly log = new Logger(MockMailService.name)

  async workspaceInvitationMailForRegisteredUser(
    email: string,
    workspace: string,
    actionUrl: string,
    invitee: string,
    role: WorkspaceRole
  ): Promise<void> {
    this.log.log(
      `Workspace Invitation Mail for Registered User: ${email}, ${workspace}, ${actionUrl}, ${invitee}, ${role}`
    )
  }

  async workspaceInvitationMailForNonRegisteredUser(
    email: string,
    workspace: string,
    actionUrl: string,
    invitee: string,
    role: WorkspaceRole
  ): Promise<void> {
    this.log.log(
      `Workspace Invitation Mail for Non Registered User: ${email}, ${workspace}, ${actionUrl}, ${invitee}, ${role}`
    )
  }

  async adminUserCreateEmail(email: string, password: string): Promise<void> {
    this.log.log(`Admin User Create Email: ${email}, ${password}`)
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    this.log.log(`OTP for ${email} is ${otp}`)
  }

  async accountLoginEmail(email: string): Promise<void> {
    this.log.log(`Account Login Email for ${email}`)
  }
}
