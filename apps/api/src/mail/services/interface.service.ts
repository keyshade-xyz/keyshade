export const MAIL_SERVICE = 'MAIL_SERVICE'

export interface IMailService {
  sendOtp(email: string, otp: string): Promise<void>

  sendEmailChangedOtp(email: string, otp: string): Promise<void>

  invitedToWorkspace(
    email: string,
    workspaceName: string,
    projectUrl: string,
    invitedBy: string,
    invitedOn: string,
    forRegisteredUser: boolean,
    inviteeName?: string
  ): Promise<void>

  accountLoginEmail(
    email: string,
    username: string,
    actionUrl: string
  ): Promise<void>

  adminUserCreateEmail(email: string): Promise<void>

  feedbackEmail(email: string, feedback: string): Promise<void>

  removedFromWorkspace(
    email: string,
    workspaceName: string,
    removedOn: Date
  ): Promise<void>

  sendLoginNotification(
    email: string,
    data: {
      ip: string
      device: string
      location?: string
    }
  ): Promise<void>
}
