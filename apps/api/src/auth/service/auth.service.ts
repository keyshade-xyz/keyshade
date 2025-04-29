import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  LoggerService,
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
   * @throws {BadRequestException} If the email address is invalid
   * @param email The email address to send the login code to
   */
  async sendOtp(email: string): Promise<void> {
    this.logger.log(`Attempting to send login code to ${email}`)

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
   * resend a login code to the given email address after resend otp button is pressed
   * @throws {BadRequestException} If the email address is invalid
   * @param email The email address to resend the login code to
   */
  async resendOtp(email: string): Promise<void> {
    this.logger.log(`Attempting to resend login code to ${email}`)

    if (!email || !email.includes('@')) {
      this.logger.error(`Invalid email address: ${email}`)
      throw new BadRequestException(
        constructErrorBody(
          'Invalid email address',
          'Please enter a valid email address'
        )
      )
    }

    const user = await getUserByEmailOrId(email, this.prisma)
    const otp = await generateOtp(email, user.id, this.prisma)
    await this.mailService.sendOtp(email, otp.code)
  }

  /* istanbul ignore next */
  /**
   * Validates a login code sent to the given email address
   * @throws {NotFoundException} If the user is not found
   * @throws {UnauthorizedException} If the login code is invalid
   * @param email The email address the login code was sent to
   * @param otp The login code to validate
   * @returns An object containing the user and a JWT token
   */
  async validateOtp(
    email: string,
    otp: string
  ): Promise<UserAuthenticatedResponse> {
    this.logger.log(`Validating login code for ${email}`)

    const user = await getUserByEmailOrId(email, this.prisma)

    this.logger.log(`Checking if OTP is valid for ${email}`)
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
      throw new UnauthorizedException(
        constructErrorBody(
          'Invalid OTP',
          'Please enter a valid 6 digit alphanumeric OTP.'
        )
      )
    }
    this.logger.log(`OTP is valid for ${email}`)

    this.logger.log(`Deleting OTP for ${email}`)
    await this.prisma.otp.delete({
      where: {
        userCode: {
          code: otp,
          userId: user.id
        }
      }
    })
    this.logger.log(`OTP deleted for ${email}`)

    this.cache.setUser(user) // Save user to cache
    this.logger.log(`User logged in: ${email}`)

    const token = await this.generateToken(user.id)

    return {
      ...user,
      token
    }
  }

  /* istanbul ignore next */
  /**
   * Handles a login with an OAuth provider
   * @param email The email of the user
   * @param name The name of the user
   * @param profilePictureUrl The profile picture URL of the user
   * @param oauthProvider The OAuth provider used
   * @returns An object containing the user and a JWT token
   */
  async handleOAuthLogin(
    email: string,
    name: string,
    profilePictureUrl: string,
    oauthProvider: AuthProvider
  ): Promise<UserAuthenticatedResponse> {
    this.logger.log(
      `Handling OAuth login. Email: ${email}, Name: ${name}, ProfilePictureUrl: ${profilePictureUrl}, OAuthProvider: ${oauthProvider}`
    )

    // We need to create the user if it doesn't exist yet
    const user = await this.createUserIfNotExists(
      email,
      oauthProvider,
      name,
      profilePictureUrl
    )

    const token = await this.generateToken(user.id)

    this.cache.setUser(user) // Save user to cache
    this.logger.log(`User logged in: ${email}`)

    return {
      ...user,
      token
    }
  }

  /* istanbul ignore next */
  /**
   * Cleans up expired OTPs every hour
   * @throws {PrismaError} If there is an error deleting expired OTPs
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanUpExpiredOtps() {
    this.logger.log('Cleaning up expired OTPs...')
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

  /**
   * Creates a user if it doesn't exist yet. If the user has signed up with a
   * different authentication provider, it throws an UnauthorizedException.
   * @param email The email address of the user
   * @param authProvider The AuthProvider used
   * @param name The name of the user
   * @param profilePictureUrl The profile picture URL of the user
   * @returns The user
   * @throws {UnauthorizedException} If the user has signed up with a different
   * authentication provider
   */
  private async createUserIfNotExists(
    email: string,
    authProvider: AuthProvider,
    name?: string,
    profilePictureUrl?: string
  ) {
    this.logger.log(
      `Creating user if not exists. Email: ${email}, AuthProvider: ${authProvider}, Name: ${name}, ProfilePictureUrl: ${profilePictureUrl}`
    )

    let user: UserWithWorkspace | null

    this.logger.log(`Checking if user exists with email: ${email}`)
    try {
      user = await getUserByEmailOrId(email, this.prisma)
    } catch (ignored) {}

    // We need to create the user if it doesn't exist yet
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

    // If the user has used OAuth to log in, we need to check if the OAuth provider
    // used in the current login is different from the one stored in the database
    if (user.authProvider !== authProvider) {
      throw new UnauthorizedException(
        constructErrorBody(
          'Error signing in',
          'The user has signed up with a different authentication provider.'
        )
      )
    }

    return user
  }

  private async generateToken(id: string) {
    return await this.jwt.signAsync({ id })
  }

  /**
   * Clears the token cookie on logout
   * @param res The response object
   */
  async logout(res: Response): Promise<void> {
    this.logger.log('Logging out user and clearing token cookie.')
    res.clearCookie('token', {
      domain: process.env.DOMAIN ?? 'localhost'
    })
    this.logger.log('User logged out and token cookie cleared.')
  }
}
