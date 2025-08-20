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
import { UserCacheService } from '@/cache/user-cache.service'
import { constructErrorBody, generateOtp } from '@/common/util'
import { createUser, getUserByEmailOrId } from '@/common/user'
import { UserWithWorkspace } from '@/user/user.types'
import { Response } from 'express'
import SlugGenerator from '@/common/slug-generator.service'
import { HydrationService } from '@/common/hydration.service'
import { isIP } from 'class-validator'
import { UAParser } from 'ua-parser-js'
import { toSHA256 } from '@/common/cryptography'
import { WorkspaceCacheService } from '@/cache/workspace-cache.service'

@Injectable()
export class AuthService {
  private readonly logger: LoggerService

  constructor(
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly cache: UserCacheService,
    private readonly slugGenerator: SlugGenerator,
    private readonly hydrationService: HydrationService,
    private readonly workspaceCacheService: WorkspaceCacheService
  ) {
    this.logger = new Logger(AuthService.name)
  }

  /**
   * Parses a login request to extract the user's IP address, device info, and location.
   * @param req The incoming HTTP request
   * @returns An object containing the IP, device fingerprint, and location string
   * @throws {Error} If the IP is invalid or cannot be parsed
   */
  public static async parseLoginRequest(req: Request): Promise<{
    ip: string
    device: string
    location: string
  }> {
    const rawIp = (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req as any).socket?.remoteAddress ||
      ''
    ).trim()

    if (!isIP(rawIp)) {
      throw new Error(`Invalid IP address: ${rawIp}`)
    }

    const userAgent = req.headers['user-agent'] || 'Unknown'
    const parser = new UAParser(userAgent)

    const browser = parser.getBrowser().name || 'Unknown'
    const os = parser.getOS().name || 'Unknown'
    const device = `${browser} on ${os}`

    let location = 'Unknown'
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const url = new URL(`https://ipwho.is/${encodeURIComponent(rawIp)}`)
      const res = await fetch(url.toString(), {
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        throw new Error(`Geolocation API error: ${res.statusText}`)
      }

      const geo = await res.json()
      if (!geo.success) throw new Error(geo.message)

      location =
        [geo.city, geo.region, geo.country].filter(Boolean).join(', ') ||
        'Unknown'
    } catch (err) {
      const logger = new Logger(AuthService.name)
      if ((err as any).name === 'AbortError') {
        logger.warn(`Geolocation request timed out for IP: ${rawIp}`)
      } else {
        logger.warn(
          `Failed to fetch location for IP: ${rawIp} — ${err.message}`
        )
      }
      location = 'Unknown'
    }

    return { ip: rawIp, device, location }
  }

  // Static helper to normalize IPs
  private static normalizeIp(raw: string): string {
    if (!raw) return 'Unknown'
    let ip = raw.split(',')[0].trim()
    if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '')
    return ip
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

    const user = await getUserByEmailOrId(
      email,
      this.prisma,
      this.slugGenerator,
      this.hydrationService,
      this.workspaceCacheService
    )
    const otp = await generateOtp(email, user.id, this.prisma)
    await this.mailService.sendOtp(email, otp.code)
  }

  /* istanbul ignore next */
  /**
   * Validates a one-time password (OTP) for a given email during login.
   * - Verifies that the OTP is valid and not expired.
   * - Deletes the OTP after successful validation.
   * - Extracts IP, device, and location from the incoming request.
   * - Sends a login notification email if the login is from a new environment.
   * - Caches the user session and returns a JWT token.
   * @param email - The email address the OTP was sent to.
   * @param otp - The OTP to validate.
   * @param req - The HTTP request object, used to extract IP/device info.
   * @throws {NotFoundException} If the user does not exist.
   * @throws {UnauthorizedException} If the OTP is invalid or expired.
   * @returns An object containing user info and a JWT token.
   */
  async validateOtp(
    email: string,
    otp: string,
    req: Request
  ): Promise<UserAuthenticatedResponse> {
    this.logger.log(`Validating login code for ${email}`)

    const user = await getUserByEmailOrId(
      email,
      this.prisma,
      this.slugGenerator,
      this.hydrationService,
      this.workspaceCacheService
    )

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
          'The OTP you entered is invalid or has expired. Please try again.'
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

    const { ip, device, location } = await AuthService.parseLoginRequest(req)

    await this.sendLoginNotification(email, { ip, device, location })

    this.cache.setUser(user)
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
    oauthProvider: AuthProvider,
    metadata?: { ip: string; device: string; location?: string }
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

    this.cache.setUser(user)
    this.logger.log(`User logged in: ${email}`)

    if (metadata) {
      await this.sendLoginNotification(email, metadata)
    }

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

  async sendLoginNotification(
    email: string,
    data: {
      ip: string
      device: string
      location?: string
    }
  ) {
    const { ip, device, location } = data
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          emailPreference: true
        }
      })

      if (!user) {
        this.logger.warn(`Login notification skipped: user ${email} not found`)
        return
      }

      const normalizedIp = AuthService.normalizeIp(ip)
      const ipHash = toSHA256(normalizedIp)
      const deviceFingerprint = device || 'Unknown'

      const existingSession = await this.prisma.loginSession.findUnique({
        where: {
          userId_ipHash_browser: {
            userId: user.id,
            ipHash,
            browser: deviceFingerprint
          }
        }
      })

      const isNew = !existingSession

      if (isNew) {
        await this.mailService.sendLoginNotification(user.email, {
          ip: normalizedIp,
          device: deviceFingerprint,
          location
        })
        this.logger.log(`Login notification sent to ${email} (new env).`)
      } else {
        this.logger.log(
          `Login notification skipped for ${email} (existing env).`
        )
      }

      await this.prisma.loginSession.upsert({
        where: {
          userId_ipHash_browser: {
            userId: user.id,
            ipHash,
            browser: deviceFingerprint
          }
        },
        update: {
          geolocation: location,
          lastLoggedOnAt: new Date()
        },
        create: {
          userId: user.id,
          ipHash,
          browser: deviceFingerprint,
          geolocation: location,
          lastLoggedOnAt: new Date()
        }
      })
    } catch (err) {
      this.logger.error(
        `Failed login notification path for ${email}: ${err.message}`,
        err.stack
      )
    }
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
      user = await getUserByEmailOrId(
        email,
        this.prisma,
        this.slugGenerator,
        this.hydrationService,
        this.workspaceCacheService
      )
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
        this.prisma,
        this.slugGenerator,
        this.hydrationService,
        this.workspaceCacheService
      )
    }

    // If the user has used OAuth to log in, we need to check if the OAuth provider
    // used in the current login is different from the one stored in the database
    if (user.authProvider !== authProvider) {
      let formattedAuthProvider = ''

      switch (user.authProvider) {
        case AuthProvider.GOOGLE:
          formattedAuthProvider = 'Google'
          break
        case AuthProvider.GITHUB:
          formattedAuthProvider = 'GitHub'
          break
        case AuthProvider.EMAIL_OTP:
          formattedAuthProvider = 'Email and OTP'
          break
        case AuthProvider.GITLAB:
          formattedAuthProvider = 'GitLab'
          break
      }

      this.logger.error(
        `User ${email} has signed up with ${user.authProvider}, but attempted to log in with ${authProvider}`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Error signing in',
          `You have already signed up with ${formattedAuthProvider}. Please use the same to sign in.`
        )
      )
    }

    return user
  }

  private async generateToken(id: string) {
    return await this.jwt.signAsync({ id })
  }
}
