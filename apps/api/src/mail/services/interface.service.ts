export const MAIL_SERVICE = 'MAIL_SERVICE'

export interface IMailService {
  sendOtp(email: string, otp: string): Promise<void>

  workspaceInvitationMailForUsers(
    email: string,
    workspace: string,
    actionUrl: string,
    invitedBy: string,
    forRegisteredUser: boolean
  ): Promise<void>

  accountLoginEmail(email: string): Promise<void>

  adminUserCreateEmail(email: string): Promise<void>

  feedbackEmail(email: string, feedback: string): Promise<void>
}
