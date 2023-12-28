import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  LoggerService
} from '@nestjs/common'
import { PrismaRepository } from '../prisma/prisma.repository'
import { randomUUID } from 'crypto'
import { JwtService } from '@nestjs/jwt'
import { UserAuthenticatedResponse } from './auth.types'
import {
  IMailService,
  MAIL_SERVICE
} from '../mail/services/mail.service.interface'

@Injectable()
export class AuthService {
  private readonly OTP_EXPIRY = 5 * 60 * 1000 // 5 minutes
  private readonly logger: LoggerService

  constructor(
    private repository: PrismaRepository,
    @Inject(MAIL_SERVICE) private mail: IMailService,
    private jwt: JwtService
  ) {
    this.logger = new Logger(AuthService.name)
  }

  async sendOtp(email: string): Promise<void> {
    if (!email || !email.includes('@')) {
      this.logger.error(`Invalid email address: ${email}`)
      throw new HttpException(
        'Please enter a valid email address',
        HttpStatus.BAD_REQUEST
      )
    }

    // We need to create the user if it doesn't exist yet
    if (!(await this.repository.findUserByEmail(email))) {
      await this.repository.createUser(email)
    }

    const otp = await this.repository.createOtp(
      email,
      randomUUID().slice(0, 6).toUpperCase(),
      this.OTP_EXPIRY
    )

    await this.mail.sendOtp(email, otp.code)
    this.logger.log(`Login code sent to ${email}: ${otp.code}`)
  }

  async validateOtp(
    email: string,
    otp: string
  ): Promise<UserAuthenticatedResponse> {
    const user = await this.repository.findUserByEmail(email)
    if (!user) {
      this.logger.error(`User not found: ${email}`)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND)
    }

    if (!(await this.repository.isOtpValid(email, otp))) {
      this.logger.error(`Invalid login code for ${email}: ${otp}`)
      throw new HttpException('Invalid login code', HttpStatus.UNAUTHORIZED)
    }

    await this.repository.deleteOtp(email, otp)

    this.logger.log(`User logged in: ${email}`)

    return {
      ...user,
      token: await this.jwt.signAsync({ id: user.id })
    }
  }
}
