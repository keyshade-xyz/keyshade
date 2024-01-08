/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from '@nestjs/common'
import { IMailService } from './interface.service'
import { ProjectRole } from '@prisma/client'

export class MockMailService implements IMailService {
  private readonly log = new Logger(MockMailService.name)

  async projectInvitationMailForRegisteredUser(
    email: string,
    project: string,
    actionUrl: string,
    invitee: string,
    role: ProjectRole
  ): Promise<void> {
    this.log.log(
      `Project Invitation Mail for Registered User: ${email}, ${project}, ${actionUrl}, ${invitee}, ${role}`
    )
  }

  async projectInvitationMailForNonRegisteredUser(
    email: string,
    project: string,
    actionUrl: string,
    invitee: string,
    role: ProjectRole
  ): Promise<void> {
    this.log.log(
      `Project Invitation Mail for Non Registered User: ${email}, ${project}, ${actionUrl}, ${invitee}, ${role}`
    )
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    this.log.log(`OTP for ${email} is ${otp}`)
  }

  async sendLogInEmail(email: string): Promise<void> {
    this.log.log(`Log In Email for ${email}`)
  }
}
