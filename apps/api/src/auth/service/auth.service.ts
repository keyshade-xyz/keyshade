import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  LoggerService
} from '@nestjs/common'
import { randomUUID } from 'crypto'
import { JwtService } from '@nestjs/jwt'
import { Cron, CronExpression } from '@nestjs/schedule'
import { UserAuthenticatedResponse } from '../auth.types'
import {
  IMailService,
  MAIL_SERVICE
} from '../../mail/services/interface.service'
import { PrismaService } from '../../prisma/prisma.service'
import { createUser } from '../../common/create-user'

@Injectable()
export class AuthService {
  private readonly OTP_EXPIRY = 5 * 60 * 1000 // 5 minutes
  private readonly logger: LoggerService

  constructor(
    @Inject(MAIL_SERVICE) private mailService: IMailService,
    private readonly prisma: PrismaService,
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
    await createUser({ email }, this.prisma)
    const otp = await this.prisma.otp.create({
      data: {
        code: randomUUID().slice(0, 6).toUpperCase(),
        expiresAt: new Date(new Date().getTime() + this.OTP_EXPIRY),
        user: {
          connect: {
            email
          }
        }
      }
    })

    await this.mailService.sendOtp(email, otp.code)
    this.logger.log(`Login code sent to ${email}: ${otp.code}`)
  }

  async validateOtp(
    email: string,
    otp: string
  ): Promise<UserAuthenticatedResponse> {
    const user = await this.findUserByEmail(email)
    if (!user) {
      this.logger.error(`User not found: ${email}`)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND)
    }

    const isOtpValid =
      (await this.prisma.otp.findUnique({
        where: {
          userCode: {
            code: otp,
            userId: user.id
          },
          expiresAt: {
            gt: new Date()
          }
        }
      })) !== null

    if (!isOtpValid) {
      this.logger.error(`Invalid login code for ${email}: ${otp}`)
      throw new HttpException('Invalid login code', HttpStatus.UNAUTHORIZED)
    }

    await this.prisma.otp.delete({
      where: {
        code: otp,
        AND: {
          user: {
            email
          }
        }
      }
    })

    this.logger.log(`User logged in: ${email}`)

    const token = await this.generteToken(user.id)

    return {
      ...user,
      token
    }
  }

  async handleGithubOAuth(
    email: string,
    name: string,
    profilePictureUrl: string
  ) {
    // We need to create the user if it doesn't exist yet
    const user = await createUser(
      { email, name, profilePictureUrl },
      this.prisma
    )

    const token = await this.generteToken(user.id)

    return {
      ...user,
      token
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanUpExpiredOtps() {
    try {
      const timeNow = new Date()
      await this.prisma.otp.deleteMany({
        where: {
          expiresAt: {
            lte: new Date(timeNow.getTime())
          }
        }
      })
      this.logger.log('Expired OTPs cleaned up successfully.')
    } catch (error) {
      this.logger.error(`Error cleaning up expired OTPs: ${error.message}`)
    }
  }

  private async generteToken(id: string) {
    return await this.jwt.signAsync({ id })
  }

  private async findUserByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: {
        email
      }
    })
  }
}
