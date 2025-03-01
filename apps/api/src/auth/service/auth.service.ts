import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  LoggerService,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Cron, CronExpression } from '@nestjs/schedule'
import { UserAuthenticatedResponse } from '../auth.types'
import { IMailService, MAIL_SERVICE } from '@/mail/services/interface.service'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthProvider } from '@prisma/client'
import { CacheService } from '@/cache/cache.service'
import { constructErrorBody, generateOtp } from '@/common/util'
import { createUser, getUserByEmailOrId } from '@/common/user'
import { UserWithWorkspace } from '@/user/user.types'
import { Response } from 'express'

@Injectable()
export class AuthService {
  private readonly logger: LoggerService

  constructor(
    @Inject(MAIL_SERVICE) private mailService: IMailService,
    private readonly prisma: PrismaService,
    private jwt: JwtService,
    private cache: CacheService
  ) {
    this.logger = new Logger(AuthService.name)
  }

  /**
   * Sends a login code to the given email address
   */
  async sendOtp(email: string): Promise<void> {
    if (!email || !email.includes('@')) {
      this.logger.error(`Invalid email address: ${email}`)
      throw new BadRequestException(
        constructErrorBody(
          'Invalid email address',
          'Please enter a valid email address'
        )
      )
    }

    const user = await this.createUserIfNotExists(email, AuthProvider.EMAIL_OTP)
    const otp = await generateOtp(email, user.id, this.prisma)
    await this.mailService.sendOtp(email, otp.code)

    this.logger.log(`Login code sent to ${email}`)
  }

  /**
   * Resends a login code after resend OTP button is pressed
   */
  async resendOtp(email: string): Promise<void> {
    const user = await getUserByEmailOrId(email, this.prisma)
    const otp = await generateOtp(email, user.id, this.prisma)
    await this.mailService.sendOtp(email, otp.code)
  }

  /**
   * Validates a login code sent to the given email address
   */
  async validateOtp(
    email: string,
    otp: string
  ): Promise<UserAuthenticatedResponse> {
    const user = await getUserByEmailOrId(email, this.prisma)
    if (!user) {
      this.logger.error(`User not found: ${email}`)
      throw new NotFoundException('User not found')
    }

    // ✅ FIXED: Corrected Prisma query for OTP validation
    const isOtpValid = await this.prisma.otp.findFirst({
      where: {
        userId: user.id, // Ensure OTP belongs to this user
        code: otp, // Validate OTP code
        expiresAt: {
          gt: new Date() // Ensure OTP is not expired
        }
      }
    })

    if (!isOtpValid) {
      this.logger.error(`Invalid login code for ${email}: ${otp}`)
      throw new UnauthorizedException(
        constructErrorBody('Invalid OTP', 'Please enter a valid 6-digit OTP.')
      )
    }

    await this.prisma.otp.delete({
      where: {
        id: isOtpValid.id // ✅ DELETE only the validated OTP
      }
    })

    this.cache.setUser(user) // Save user to cache
    this.logger.log(`User logged in: ${email}`)

    const token = await this.generateToken(user.id)

    return {
      ...user,
      token
    }
  }

  /**
   * Handles a login with an OAuth provider
   */
  async handleOAuthLogin(
    email: string,
    name: string,
    profilePictureUrl: string,
    oauthProvider: AuthProvider
  ): Promise<UserAuthenticatedResponse> {
    const user = await this.createUserIfNotExists(
      email,
      oauthProvider,
      name,
      profilePictureUrl
    )

    const token = await this.generateToken(user.id)

    return {
      ...user,
      token
    }
  }

  /**
   * Cleans up expired OTPs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanUpExpiredOtps() {
    try {
      await this.prisma.otp.deleteMany({
        where: {
          expiresAt: {
            lte: new Date()
          }
        }
      })
      this.logger.log('Expired OTPs cleaned up successfully.')
    } catch (error) {
      this.logger.error(`Error cleaning up expired OTPs: ${error.message}`)
    }
  }

  /**
   * Creates a user if they don't exist
   */
  private async createUserIfNotExists(
    email: string,
    authProvider: AuthProvider,
    name?: string,
    profilePictureUrl?: string
  ) {
    let user: UserWithWorkspace | null

    try {
      user = await getUserByEmailOrId(email, this.prisma)
    } catch (ignored) {}

    if (!user) {
      user = await createUser(
        {
          email,
          name,
          profilePictureUrl,
          authProvider
        },
        this.prisma
      )
    }

    if (user.authProvider !== authProvider) {
      throw new UnauthorizedException(
        'The user has signed up with a different authentication provider.'
      )
    }

    return user
  }

  private async generateToken(id: string) {
    return await this.jwt.signAsync({ id })
  }

  /**
   * Clears the token cookie on logout
   */
  async logout(res: Response): Promise<void> {
    res.clearCookie('token', {
      domain: process.env.DOMAIN ?? 'localhost'
    })
    this.logger.log('User logged out and token cookie cleared.')
  }
}
