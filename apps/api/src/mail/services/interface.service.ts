import { WorkspaceRole } from '@prisma/client'

export const MAIL_SERVICE = 'MAIL_SERVICE'

export interface IMailService {
  sendOtp(email: string, otp: string): Promise<void>

  workspaceInvitationMailForRegisteredUser(
    email: string,
    workspace: string,
    actionUrl: string,
    invitedBy: string,
    role: WorkspaceRole
  ): Promise<void>

  workspaceInvitationMailForNonRegisteredUser(
    email: string,
    workspace: string,
    actionUrl: string,
    invitedBy: string,
    role: WorkspaceRole
  ): Promise<void>
}
