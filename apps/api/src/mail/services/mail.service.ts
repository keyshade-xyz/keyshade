import {
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common'
import { IMailService } from './interface.service'
import { Transporter, createTransport } from 'nodemailer'
import RemovedFromWorkspaceEmail from '../emails/workspace-removal'
import { render } from '@react-email/render'
import WorkspaceInvitationEmail from '../emails/workspace-invitation'
import OTPEmailTemplate from '../emails/otp-email-template'

@Injectable()
export class MailService implements IMailService {
  private readonly transporter: Transporter
  private readonly log = new Logger(MailService.name)

  constructor() {
    this.transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_EMAIL_ADDRESS,
        pass: process.env.SMTP_PASSWORD
      }
    })
  }
  async invitedToWorkspace(
    email: string,
    workspaceName: string,
    actionUrl: string,
    invitedBy: string,
    invitedOn: string,
    forRegisteredUser: boolean
  ): Promise<void> {
    const subject = forRegisteredUser
      ? 'Welcome Back! Join Your Workspace'
      : 'You are Invited to Join the Workspace'

    const body = await render(
      WorkspaceInvitationEmail({
        workspaceName,
        actionUrl,
        invitedBy,
        invitedOn,
        forRegisteredUser
      })
    )
    await this.sendEmail(email, subject, body)
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    const subject = 'Your One Time Password (OTP) for Keyshade'

    const body = await render(
      OTPEmailTemplate({
        otp
      })
    )

    await this.sendEmail(email, subject, body)
  }
  async sendEmailChangedOtp(email: string, otp: string): Promise<void> {
    const subject = 'Your Keyshade Email Change One Time Password (OTP)'

    const body = await render(
      OTPEmailTemplate({
        otp
      })
    )

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
    await this.sendEmail(process.env.ADMIN_EMAIL!, subject, body)
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

  async removedFromWorkspace(
    email: string,
    workspaceName: string,
    removedOn: Date
  ): Promise<void> {
    const subject = `Your access was revoked from ${workspaceName}`

    const body = await render(
      RemovedFromWorkspaceEmail({
        removedOn: removedOn.toISOString(),
        workspaceName
      })
    )

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
