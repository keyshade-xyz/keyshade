import { WorkspaceRole } from '@prisma/client'

export const MAIL_SERVICE = 'MAIL_SERVICE'

export interface IMailService {
  sendOtp(email: string, otp: string): Promise<void>

  workspaceInvitationMailForUsers(
    email: string,
    workspace: string,
    actionUrl: string,
    invitedBy: string,
    role: WorkspaceRole,
    forRegisteredUser: boolean
  ): Promise<void>


  accountLoginEmail(email: string): Promise<void>

  adminUserCreateEmail(email: string): Promise<void>
}
