import {
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common'
import { IMailService } from './interface.service'
import { Transporter, createTransport } from 'nodemailer'

@Injectable()
export class MailService implements IMailService {
  private readonly transporter: Transporter
  private readonly log = new Logger(MailService.name)

  constructor() {
    this.transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL_ADDRESS,
        pass: process.env.SMTP_PASSWORD
      }
    })
  }
  async workspaceInvitationMailForUsers(
    email: string,
    workspace: string,
    actionUrl: string,
    invitee: string,
    forRegisteredUser: boolean
  ): Promise<void> {
    const subject = `You have been invited to a ${workspace}`
    const intro = forRegisteredUser
      ? `Hello again! You've been invited to join a new workspace.`
      : `Hello there! We're excited to welcome you to Keyshade.`
    const body = `<!DOCTYPE html>
        <html>
        <head>
           <title>Workspace Invitation</title>
        </head>
        <body>
           <h1>Welcome to keyshade!</h1>
           <p>${intro}</p>
           <p>You have been invited to join the workspace <strong>${workspace}</strong> by <strong>${invitee}</strong>.</p>
           <p>Please click on the link below to accept the invitation.</p>
           <p><a href="${actionUrl}">Accept Invitation</a></p>
           <p>Thank you for choosing us.</p>
           <p>Best Regards,</p>
           <p>keyshade Team</p>
        </body>
        </html>`
    await this.sendEmail(email, subject, body)
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    const subject = 'Your Login OTP'
    const body = `<!DOCTYPE html>
        <html>
        <head>
           <title>OTP Verification</title>
        </head>
        <body>
           <h1>Welcome to keyshade!</h1>
           <p>Hello there!</p>
           <p>We have sent you this email to verify your account.</p>
           <p>Your One Time Password (OTP) is: <strong>${otp}</strong></p>
           <p>This OTP will expire in <strong>5 minutes</strong>.</p>
           <p>Please enter this OTP in the application to verify your account.</p>
           <p>Thank you for choosing us.</p>
           <p>Best Regards,</p>
           <p>keyshade Team</p>
        </body>
        </html>
        `
    await this.sendEmail(email, subject, body)
  }
  async sendEmailChangedOtp(email: string, otp: string): Promise<void> {
    const subject = 'Your OTP for Email Change'
    const body = `<!DOCTYPE html>
        <html>
        <head>
           <title>OTP Verification</title>
        </head>
        <body>
           <h1>Are you trying to change your email?</h1>
           <p>Hello there!</p>
           <p>We have sent you this email to verify your new email.</p>
           <p>Your One Time Password (OTP) is: <strong>${otp}</strong></p>
           <p>This OTP will expire in <strong>5 minutes</strong>.</p>
           <p>Please enter this OTP in the application to verify your new email.</p>
           <p>Thank you.</p>
           <p>Best Regards,</p>
           <p>keyshade Team</p>
        </body>
        </html>
        `
    await this.sendEmail(email, subject, body)
  }
  async accountLoginEmail(email: string): Promise<void> {
    const subject = 'LogIn Invitation Accepted'
    const body = `<!DOCTYPE html>
        <html>
        <head>
           <title>LogIn Invitaion</title>
        </head>
        <body>
           <h1>Welcome to keyshade!</h1>
           <p>Hello there!</p>
           <p>Your account has been setup. Please login to your account for further process.</p>
           <p>Thank you for choosing us.</p>
           <p>Best Regards,</p>
           <p>keyshade Team</p>
        </body>
        </html>
        `
    await this.sendEmail(email, subject, body)
  }

  async adminUserCreateEmail(email: string): Promise<void> {
    const subject = 'Admin User Created!!'
    const body = `<!DOCTYPE html>
        <html>
        <head>
           <title>Admin User Was Created!</title>
        </head>
        <body>
           <h1>Welcome to keyshade!</h1>
           <p>Hello there!</p>
           <p>Your admin account has been setup. Please login to your account for further process.</p>
           <p>Your email is: <strong>${email}</strong></p>
           <p>Thank you for choosing us.</p>
           <p>Best Regards,</p>
           <p>keyshade Team</p>
        </body>
        `
    await this.sendEmail(process.env.ADMIN_EMAIL, subject, body)
  }

  async feedbackEmail(email: string, feedback: string): Promise<void> {
    const subject = 'New Feedback Received !'
    const body = `<!DOCTYPE html>
    <html>
    <head>
       <title>New Feedback Received !</title>
    </head>
    <body>
       <h1>New Feedback Received</h1>
       <p>Hello,</p>
       <p>We have received new feedback from a user:</p>
       <blockquote>${feedback}</blockquote>
       <p>Please review this feedback as soon as possible.</p>
       <p>Thank you.</p>
       <p>Best Regards,</p>
       <p>Keyshade Team</p>
    </body>
    </html>
    `
    await this.sendEmail(email, subject, body)
  }

  async workspaceRemoval(
    email: string,
    workspaceName: string,
    removedOn: string
  ): Promise<void> {
    const subject = 'Workspace Removal Notification'
    const body = `<!DOCTYPE html>
      <html lang="en">
      <head>
          <style>
              body {
                  font-family: 'Segoe UI', 'Roboto', sans-serif;
                  line-height: 1.6;
                  color: #04050a;
                  background-color: #fafafa;
                  margin: 0;
                  padding: 20px;
              }

              .email-wrapper {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #fff;
                  border-radius: 5px;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                  border-spacing: 0;
                  width: 100%;
              }

              h1 {
                  color: #000;
                  margin-bottom: 20px;
                  font-size: 24px;
                  font-weight: 600;
              }

              p {
                  margin-bottom: 15px;
                  color: #666;
              }

              .p-40 {
                  padding: 40px;
              }

              .workspace-details {
                border: 0;
                width: 100%;
                background-color: #fafafa;
                border-radius: 5px;
                margin-bottom: 20px;
                padding: 18px;
              }

              .workspace-details tr td:first-child {
                  color: #000;
              }

              .workspace-details tr td:last-child {
                  color: #666;
              }

              hr {
                  border: none;
                  border-top: 1px solid #eaeaea;
                  margin: 20px 0;
              }

              .footer-text {
                  font-size: 12px;
                  color: #999;
                  text-align: center;
              }
          </style>
      </head>
      <body>
          <table class="email-wrapper" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                  <td class="p-40">
                      <h1>Removal from Workspace</h1>
                      <p>Dear User,</p>
                      <p>We hope this email finds you well. We are writing to inform you that your access to the following workspace has been removed:</p>
                      <table class="workspace-details">
                          <tr class="workspace-info">
                              <td>Workspace Name:</td>
                              <td>${workspaceName}</td>
                          </tr>
                          <tr class="workspace-info">
                              <td>Removed On:</td>
                              <td>${removedOn}</td>
                          </tr>
                      </table>
                      <p>If you believe this action was taken in error or have any questions regarding this change, please contact your project administrator or our support team.</p>
                      <p>We appreciate your understanding and thank you for your contributions to the project.</p>
                      <p>Cheers,<br>Team Keyshade</p>
                      <hr />
                      <p class="footer-text">This is an automated message. Please do not reply to this email.</p>
                      <p class="footer-text">
                        Read our <a href="https://www.keyshade.xyz/privacy">Privacy Policy</a> and <a href="https://www.keyshade.xyz/terms_and_condition">Terms and Conditions</a> for more information on how we manage your data and services.
                      </p>
                  </td>
              </tr>
          </table>
      </body>
      </html>
    `
    await this.sendEmail(email, subject, body)
  }

  private async sendEmail(
    email: string,
    subject: string,
    body: string
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: email,
        subject: subject,
        html: body
      })
      this.log.log(`Email sent to ${email}`)
    } catch (error) {
      this.log.error(`Error sending email to ${email}: ${error.message}`)
      throw new InternalServerErrorException(
        `Error sending email to ${email}: ${error.message}`
      )
    }
  }
}
