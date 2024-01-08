import { ProjectRole } from '@prisma/client'

export const MAIL_SERVICE = 'MAIL_SERVICE'

export interface IMailService {
  sendOtp(email: string, otp: string): Promise<void>

  projectInvitationMailForRegisteredUser(
    email: string,
    project: string,
    actionUrl: string,
    invitedBy: string,
    role: ProjectRole
  ): Promise<void>

  projectInvitationMailForNonRegisteredUser(
    email: string,
    project: string,
    actionUrl: string,
    invitedBy: string,
    role: ProjectRole
  ): Promise<void>
  
  sendLogInEmail(email: string): Promise<void>
}
