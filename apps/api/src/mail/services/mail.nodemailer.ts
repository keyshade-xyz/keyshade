import { Injectable, Logger } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import { IMailService } from './mail.service.interface'

@Injectable()
export class MailService implements IMailService {
  private transporter: nodemailer.Transporter
  private readonly log = new Logger(MailService.name)

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    })
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
