import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { DeviceDetail, UserAuthenticatedResponse } from '../auth.types'
import { IMailService, MAIL_SERVICE } from '@/mail/services/interface.service'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthProvider, UserSession } from '@prisma/client'
import { UserCacheService } from '@/cache/user-cache.service'
import { constructErrorBody, generateOtp } from '@/common/util'
import { createUser, getUserByEmailOrId } from '@/common/user'
import { UserWithWorkspace } from '@/user/user.types'
import { Response } from 'express'
import SlugGenerator from '@/common/slug-generator.service'
import { HydrationService } from '@/common/hydration.service'
import { isEmail, isIP } from 'class-validator'
import { UAParser } from 'ua-parser-js'
import { sEncrypt } from '@/common/cryptography'
import { WorkspaceCacheService } from '@/cache/workspace-cache.service'
import { TokenService } from '@/common/token.service'
import dayjs from 'dayjs'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService,
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly cache: UserCacheService,
    private readonly slugGenerator: SlugGenerator,
    private readonly hydrationService: HydrationService,
    private readonly workspaceCacheService: WorkspaceCacheService
  ) {}

  /**
   * Sends a login code to the given email address
   * @throws {BadRequestException} If the email address is invalid
   * @param email The email address to send the login code to
   * @param mode The mode of login
   */
  async sendOtp(email: string, mode?: string): Promise<void> {
    this.logger.log(`Attempting to send login code to ${email}`)

    this.validateEmail(email)

    // Create the user if it doesn't exist
    const user = await this.createUserIfNotExists(
      email,
      AuthProvider.EMAIL_OTP,
      null,
      null,
      mode
    )

    // Generate the OTP
    const otp = await generateOtp(email, user.id, this.prisma)

    // Send the OTP to the user
    if (mode === 'cli') {
      await this.mailService.sendSignInCode(email, otp.code, user.name)
    } else {
      await this.mailService.sendOtp(email, otp.code)
    }

    this.logger.log(`Login code sent to ${email}`)
  }

  /**
   * Resend a login code to the given email address after resend otp button is pressed
   * @throws {BadRequestException} If the email address is invalid
   * @param email The email address to resend the login code to
   */
  async resendOtp(email: string): Promise<void> {
    this.logger.log(`Attempting to resend login code to ${email}`)
    this.validateEmail(email)
    const user = await getUserByEmailOrId(
      email,
      this.prisma,
      this.slugGenerator,
      this.hydrationService,
      this.workspaceCacheService
    )
    const otp = await generateOtp(email, user.id, this.prisma)
    await this.mailService.sendOtp(email, otp.code)
    this.logger.log(`Login code resent to ${email}`)
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
   * @param mode - The mode of login.
   * @throws {UnauthorizedException} If the OTP is invalid or expired.
   * @returns An object containing user info and a JWT token.
   */
  async validateOtp(
    email: string,
    otp: string,
    req: Request,
    mode?: string
  ): Promise<UserAuthenticatedResponse> {
    this.logger.log(`Validating login code for ${email}`)

    const user = await getUserByEmailOrId(
      email,
      this.prisma,
      this.slugGenerator,
      this.hydrationService,
      this.workspaceCacheService
    )
    await this.cache.setUser(user)

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

    let cliSessionId: string
    let loginToken: string

    const deviceDetail = await this.extractDeviceDetailFromRequest(req)
    if (mode === 'cli') {
      const { token, cliSession } =
        await this.tokenService.generateCliAccessToken(user.id, deviceDetail)
      loginToken = token
      cliSessionId = cliSession.id
    } else {
      const { token, userSession } =
        await this.tokenService.generateBearerToken(user.id, deviceDetail)
      await this.sendLoginNotification(user, deviceDetail, userSession)
      loginToken = token
    }

    return {
      ...user,
      token: loginToken,
      cliSessionId
    }
  }

  /* istanbul ignore next */
  /**
   * Handles a login with an OAuth provider
   * @param email The email of the user
   * @param name The name of the user
   * @param profilePictureUrl The profile picture URL of the user
   * @param oauthProvider The OAuth provider used
   * @param req The HTTP request object
   *
   * @returns An object containing the user and a JWT token
   */
  async handleOAuthLogin(
    email: string,
    name: string,
    profilePictureUrl: string,
    oauthProvider: AuthProvider,
    req: Request
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
    await this.cache.setUser(user)

    const deviceDetail = await this.extractDeviceDetailFromRequest(req)
    const { token, userSession } = await this.tokenService.generateBearerToken(
      user.id,
      deviceDetail
    )
    await this.sendLoginNotification(user, deviceDetail, userSession)

    return {
      ...user,
      token
    }
  }

  /* istanbul ignore next */
  /**
   * Cleans up expired OTPs every hour
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

  private async sendLoginNotification(
    user: UserWithWorkspace,
    deviceDetail: DeviceDetail,
    currentUserSession: UserSession
  ) {
    const {
      ipAddress,
      encryptedIpAddress,
      os,
      platform,
      city,
      country,
      region
    } = deviceDetail
    const { email, id: userId } = user
    try {
      // Find all the existing sessions of the user where the device detail matches
      const existingSessions = await this.prisma.userSession.findMany({
        where: {
          userId,
          deviceDetail: {
            encryptedIpAddress,
            os,
            platform
          },
          NOT: {
            id: currentUserSession.id
          }
        }
      })
      const existingSession =
        existingSessions.length > 0 ? existingSessions[0] : undefined
      const isNew = !existingSession

      // Send a login notification email only if the user is logging in from a new environment
      if (isNew) {
        this.logger.log(`Sending login notification for ${email}.`)

        // Generate time strings
        const timeNow = new Date()
        const date = dayjs(timeNow).format('MMMM D, YYYY')
        const time = dayjs(timeNow).format('h:mm A')

        // Send out the email
        await this.mailService.sendLoginNotification(user.email, {
          ip: ipAddress,
          device: `${platform} on ${os}`,
          location: `${city}, ${region}, ${country}`,
          date,
          time
        })

        this.logger.log(`Login notification sent to ${email}.`)
      } else {
        this.logger.log(`Skipped sending login notification for ${email}.`)
      }
    } catch (err) {
      this.logger.error(
        `Failed login notification path for ${email}: ${err.message}`,
        err.stack
      )
    }
  }

  /**
   * Parses a login request to extract the user's IP address, device info, and location.
   * @param req The incoming HTTP request
   * @returns An object containing the IP, device fingerprint, and location string
   * @throws {Error} If the IP is invalid or cannot be parsed
   */
  private async extractDeviceDetailFromRequest(
    req: Request
  ): Promise<DeviceDetail> {
    this.logger.log('Extracting device detail from request...')

    const rawIp = (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req as any).socket?.remoteAddress ||
      ''
    ).trim()

    if (!isIP(rawIp)) {
      this.logger.error(`Invalid IP address: ${rawIp}`)
      throw new UnauthorizedException(
        constructErrorBody(
          'Uh-oh! Something went wrong.',
          'We are unable to verify your identity. Please try again later.'
        )
      )
    }

    const userAgent = req.headers['user-agent'] || 'Unknown'
    const parser = new UAParser(userAgent)

    const platform = parser.getBrowser().name || 'Unknown' // Can be a browser, or CLI, or SDKs
    const os = parser.getOS().name || 'Unknown'

    let city: string
    let region: string
    let country: string

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

      city = geo.city || 'Unknown'
      region = geo.region || 'Unknown'
      country = geo.country_name || 'Unknown'
    } catch (err) {
      if ((err as any).name === 'AbortError') {
        this.logger.warn(`Geolocation request timed out for IP: ${rawIp}`)
      } else {
        this.logger.warn(
          `Failed to fetch location for IP: ${rawIp} — ${err.message}`
        )
      }

      city = 'Unknown'
      region = 'Unknown'
      country = 'Unknown'
    }

    const ipAddress = this.normalizeIp(rawIp)
    const encryptedIpAddress = sEncrypt(ipAddress)
    const deviceDetail = {
      ipAddress,
      encryptedIpAddress,
      os,
      platform,
      city,
      region,
      country
    }

    this.logger.log(
      `Device detail extracted successfully: ${JSON.stringify(deviceDetail, null, 2)}`
    )
    return deviceDetail
  }

  /**
   * Creates a user if it doesn't exist yet. If the user has signed up with a
   * different authentication provider, it throws a UnauthorizedException.
   * @param email The email address of the user
   * @param authProvider The AuthProvider used
   * @param name The name of the user
   * @param profilePictureUrl The profile picture URL of the user
   * @param mode The mode of login
   * @returns The user
   * @throws {UnauthorizedException} If the user has signed up with a different
   * authentication provider
   */
  private async createUserIfNotExists(
    email: string,
    authProvider: AuthProvider,
    name?: string,
    profilePictureUrl?: string,
    mode?: string
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
      if (mode === 'cli') {
        throw new NotFoundException(
          constructErrorBody(
            'Account not found',
            'We were not able to find an account with this email address. Please sign up first.'
          )
        )
      }

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
    // used in the current login is different from the one stored in the database.

    // If the CLI was used to sign up, we don't need to check for OAuth provider mismatch.
    if (mode !== 'cli' && user.authProvider !== authProvider) {
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

  private validateEmail(email: string) {
    if (!isEmail(email)) {
      this.logger.error(`Invalid email address: ${email}`)
      throw new BadRequestException(
        constructErrorBody(
          'Invalid email address',
          'Please enter a valid email address'
        )
      )
    }
  }

  private normalizeIp(raw: string): string {
    if (!raw) return 'Unknown'
    let ip = raw.split(',')[0].trim()
    if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '')
    return ip
  }
}
