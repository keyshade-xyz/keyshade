import { Injectable, Logger } from '@nestjs/common'
import { IMailService } from './interface.service'
import { WorkspaceRole } from '@prisma/client'
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
  async workspaceInvitationMailForRegisteredUser(
    email: string,
    workspace: string,
    actionUrl: string,
    invitee: string,
    role: WorkspaceRole
  ): Promise<void> {
    const subject = `You have been invited to a ${workspace}`
    const body = `<!DOCTYPE html>
        <html>
        <head>
           <title>Workspace Invitation</title>
        </head>
        <body>
           <h1>Welcome to keyshade!</h1>
           <p>Hello there!</p>
           <p>You have been invited to join the workspace <strong>${workspace}</strong> by <strong>${invitee}</strong> as ${role.toString()}.</p>
           <p>Please click on the link below to accept the invitation.</p>
           <p><a href="${actionUrl}">Accept Invitation</a></p>
           <p>Thank you for choosing us.</p>
           <p>Best Regards,</p>
           <p>keyshade Team</p>
        </body>
        </html>
        `
    await this.sendEmail(email, subject, body)
  }

  async workspaceInvitationMailForNonRegisteredUser(
    email: string,
    workspace: string,
    actionUrl: string,
    invitee: string,
    role: WorkspaceRole
  ): Promise<void> {
    const subject = `You have been invited to a ${workspace}`
    const body = `<!DOCTYPE html>
        <html>
        <head>
           <title>Workspace Invitation</title>
        </head>
        <body>
           <h1>Welcome to keyshade!</h1>
           <p>Hello there!</p>
           <p>You have been invited to join the workspace <strong>${workspace}</strong> by <strong>${invitee}</strong> as ${role.toString()}.</p>
           <p>Please click on the link below to accept the invitation.</p>
           <p><a href="${actionUrl}">Accept Invitation</a></p>
           <p>Thank you for choosing us.</p>
           <p>Best Regards,</p>
           <p>keyshade Team</p>
        </body>
        </html>
        `
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
      throw new Error(`Error sending email to ${email}: ${error.message}`)
    }
  }
}
