import { Injectable, Logger } from '@nestjs/common'
import { Resend } from 'resend'
import { IResendService } from './resend.service.interface'
import { $Enums } from '@prisma/client'

@Injectable()
export class MailResend implements IResendService {
  private readonly resend: Resend
  private readonly log = new Logger(MailResend.name)

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY)
  }
  async projectInvitationMailForRegisteredUser(
    email: string,
    project: string,
    actionUrl: string,
    invitee: string,
    role: $Enums.ProjectRole
  ): Promise<void> {
    const subject = `You have been invited to a ${project}`
    const body = `<!DOCTYPE html>
        <html>
        <head>
           <title>Project Invitation</title>
        </head>
        <body>
           <h1>Welcome to keyshade!</h1>
           <p>Hello there!</p>
           <p>You have been invited to join the project <strong>${project}</strong> by <strong>${invitee}</strong> as ${role.toString()}.</p>
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

  async projectInvitationMailForNonRegisteredUser(
    email: string,
    project: string,
    actionUrl: string,
    invitee: string,
    role: $Enums.ProjectRole
  ): Promise<void> {
    const subject = `You have been invited to a ${project}`
    const body = `<!DOCTYPE html>
        <html>
        <head>
           <title>Project Invitation</title>
        </head>
        <body>
           <h1>Welcome to keyshade!</h1>
           <p>Hello there!</p>
           <p>You have been invited to join the project <strong>${project}</strong> by <strong>${invitee}</strong> as ${role.toString()}.</p>
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
    this.sendEmail(email, subject, body)
  }

  private async sendEmail(
    email: string,
    subject: string,
    body: string
  ): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: email,
      subject,
      html: body
    })

    if (error) {
      this.log.error(`Error sending email to ${email}: ${error.message}`)
      throw new Error(error.message)
    }
  }
}
