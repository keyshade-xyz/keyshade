import { ProjectRole } from '@prisma/client'

export const RESEND_SERVICE = 'RESEND_SERVICE'

export interface IResendService {
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
}
