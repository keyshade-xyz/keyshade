import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException
} from '@nestjs/common'
import { CliSession, User, UserSession } from '@prisma/client'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '@/prisma/prisma.service'
import { toSHA256 } from '@/common/cryptography'
import { DeviceDetail } from '@/auth/auth.types'
import * as crypto from 'crypto'
import dayjs from 'dayjs'
import { constructErrorBody } from '@/common/util'
import { Cron, CronExpression } from '@nestjs/schedule'

export enum TokenType {
  BEARER = 'Bearer',
  CLI_ACCESS_TOKEN = 'CLI',
  PERSONAL_ACCESS_TOKEN = 'PersonalAccessToken',
  SERVICE_ACCOUNT_ACCESS_TOKEN = 'ServiceAccountAccessToken'
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Cron job to delete expired tokens.
   *
   * This job runs every day at midnight. It deletes expired CLI tokens and user sessions from the database.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  public async deleteExpiredTokens(): Promise<void> {
    try {
      // Delete expired CLI tokens
      this.logger.log(`Cleaning up expired CLI tokens...`)
      const cliTokensDeleted = await this.prisma.cliSession.deleteMany({
        where: {
          expiresOn: {
            lt: new Date()
          }
        }
      })
      this.logger.log(`Deleted ${cliTokensDeleted.count} expired CLI tokens.`)

      // Delete expired user sessions
      this.logger.log(`Cleaning up expired user sessions...`)
      const userSessionsDeleted = await this.prisma.userSession.deleteMany({
        where: {
          expiresOn: {
            lt: new Date()
          }
        }
      })
      this.logger.log(`Deleted ${userSessionsDeleted.count} user sessions.`)
    } catch (error) {
      this.logger.error(
        `Encountered an error while deleting expired tokens: ${error.message}`
      )
    }
  }

  /**
   * Generates a new bearer token for the specified user and stores the session details in the database.
   *
   * @param {User['id']} userId - The unique identifier of the user for whom the token is being generated.
   * @param {DeviceDetail} deviceDetail - The device details to associate with the session.
   * @return {Promise<string>} A promise that resolves to the generated bearer token.
   */
  public async generateBearerToken(
    userId: User['id'],
    deviceDetail: DeviceDetail
  ): Promise<{
    token: string
    userSession: UserSession
  }> {
    // Generate the token
    this.logger.log(`Generating bearer token for user ${userId}`)
    const bearerToken = await this.jwtService.signAsync({ id: userId })
    const bearerTokenHash = toSHA256(bearerToken)
    this.logger.log(
      `Bearer token hash ${bearerTokenHash} generated for ${userId}`
    )

    // Save the session to the database
    try {
      this.logger.log(
        `Saving bearer token ${bearerTokenHash} for user ${userId} in session...`
      )
      const userSession = await this.prisma.userSession.create({
        data: {
          tokenHash: bearerTokenHash,
          user: {
            connect: {
              id: userId
            }
          },
          expiresOn: dayjs().add(30, 'days').toDate(),
          deviceDetail: {
            create: {
              encryptedIpAddress: deviceDetail.encryptedIpAddress,
              os: deviceDetail.os,
              platform: deviceDetail.platform,
              city: deviceDetail.city,
              region: deviceDetail.region,
              country: deviceDetail.country
            }
          }
        }
      })
      this.logger.log(
        `Saved bearer token ${bearerTokenHash} for user ${userId}: ${userSession.id}`
      )

      return {
        token: bearerToken,
        userSession
      }
    } catch (error) {
      this.logger.error(
        `Encountered an error while saving bearer token ${bearerTokenHash} for user ${userId}: ${error.message}`
      )
      throw new InternalServerErrorException(
        constructErrorBody(
          'Uh-oh! Something went wrong on our end.',
          'We encountered an error while generating your secure token. Please try again later. If the problem persists, get in touch with us at support@keyshade.xyz'
        )
      )
    }
  }

  /**
   * Generates a CLI access token for the specified user and device.
   *
   * @param {User['id']} userId - The unique identifier of the user for whom the token is being generated.
   * @param {DeviceDetail} deviceDetail - The details of the device requesting the token, including hardware and metadata information.
   * @return {Promise<string>} A promise that resolves to the generated CLI access token string.
   */
  public async generateCliAccessToken(
    userId: User['id'],
    deviceDetail: DeviceDetail
  ): Promise<{
    token: string
    cliSession: CliSession
  }> {
    // Generate the token
    this.logger.verbose(
      `Generating CLI token for user ${userId} with device: ${deviceDetail}`
    )
    const secureRandom = crypto.randomBytes(32).toString('hex')
    const secureRandomHash = toSHA256(secureRandom)
    const token = `ks.cli.${secureRandomHash}`
    this.logger.log(`Generated token ${secureRandomHash} for user ${userId}`)

    // Save to the database
    try {
      this.logger.log(`Saving CLI token ${secureRandomHash} for user ${userId}`)
      const cliSession = await this.prisma.cliSession.create({
        data: {
          tokenHash: secureRandomHash,
          user: {
            connect: {
              id: userId
            }
          },
          expiresOn: dayjs().add(6, 'months').toDate(),
          deviceDetail: {
            create: {
              encryptedIpAddress: deviceDetail.encryptedIpAddress,
              os: deviceDetail.os,
              platform: deviceDetail.platform,
              city: deviceDetail.city,
              region: deviceDetail.region,
              country: deviceDetail.country
            }
          }
        }
      })
      this.logger.log(
        `Saved CLI token ${secureRandomHash} for user ${userId}: ${cliSession.id}`
      )

      return {
        token,
        cliSession
      }
    } catch (error) {
      this.logger.error(
        `Encountered an error while saving CLI token ${secureRandomHash} for user ${userId}: ${error.message}`
      )
      throw new InternalServerErrorException(
        constructErrorBody(
          'Uh-oh! Something went wrong on our end.',
          'We encountered an error while generating your secure token. Please try again later. If the problem persists, get in touch with us at support@keyshade.xyz'
        )
      )
    }
  }

  public generateUserAccessToken(): Promise<string> {
    throw new InternalServerErrorException('Not implemented')
  }

  public generateServiceAccountAccessToken(): Promise<string> {
    throw new InternalServerErrorException('Not implemented')
  }

  public determineTokenType(token: string): TokenType | null {
    if (token.startsWith('Bearer')) {
      return TokenType.BEARER
    } else {
      // Valid types:
      // ks.cli.hash -> CLI_ACCESS_TOKEN
      // ks.pat.hash -> PERSONAL_ACCESS_TOKEN
      // ks.sat.hash -> SERVICE_ACCOUNT_ACCESS_TOKEN

      const type = token.split('.')[1]
      switch (type) {
        case 'cli':
          return TokenType.CLI_ACCESS_TOKEN
        case 'pat':
          return TokenType.PERSONAL_ACCESS_TOKEN
        case 'sat':
          return TokenType.SERVICE_ACCOUNT_ACCESS_TOKEN
        default:
          throw new UnauthorizedException('Invalid token type')
      }
    }
  }

  public async validateToken(token: string): Promise<User['id']> {
    let userId: User['id']
    const tokenType = this.determineTokenType(token)

    switch (tokenType) {
      case TokenType.BEARER:
        userId = await this.validateBearerToken(token)
        break
      case TokenType.CLI_ACCESS_TOKEN:
        userId = await this.validateCliAccessToken(token)
        break
      case TokenType.PERSONAL_ACCESS_TOKEN:
        userId = await this.validateUserAccessToken(token)
        break
      case TokenType.SERVICE_ACCOUNT_ACCESS_TOKEN:
        userId = await this.validateServiceAccountAccessToken(token)
        break
      default:
        throw new UnauthorizedException('Invalid token type')
    }

    return userId
  }

  /**
   * Validates a Bearer token by extracting the token, verifying it against the database,
   * and decoding its payload to ensure it is associated with a valid user.
   *
   * @param {string} token - The Bearer token provided in the authorization header of a request.
   * @return {Promise<User['id']>} A promise that resolves to the user's unique identifier (id) if the token is valid.
   * @throws {UnauthorizedException} If the token is invalid, not found in the session store, or does not produce a valid payload.
   */
  private async validateBearerToken(token: string): Promise<User['id']> {
    // Extract the actual token from the Bearer token
    const actualToken = this.extractActualToken(token)

    // Validate the token against the user session store
    const userSession = await this.prisma.userSession.findUnique({
      where: {
        tokenHash: toSHA256(actualToken)
      }
    })
    if (!userSession) {
      throw new UnauthorizedException(
        'Error validating JWT token: No user session found against the token'
      )
    }

    // Update the last used date of the session
    await this.prisma.userSession.update({
      where: {
        id: userSession.id
      },
      data: {
        lastUsedOn: new Date()
      }
    })

    // Validate the token payload against the user session
    try {
      const payload = await this.jwtService.verifyAsync(actualToken, {
        secret: process.env.JWT_SECRET
      })
      return payload.id
    } catch (error) {
      throw new UnauthorizedException(
        `Error validating JWT token: ${error.message}`
      )
    }
  }

  /**
   * Validates a CLI access token by checking its presence and expiration in the database.
   *
   * @param {string} token - The CLI access token to validate.
   * @return {Promise<User['id']>} - A promise that resolves to the user ID associated with the token if it is valid.
   * @throws {UnauthorizedException} - If the token does not exist or has expired.
   */
  private async validateCliAccessToken(token: string): Promise<User['id']> {
    // Extract the actual token from the complete token
    const actualToken = this.extractActualToken(token)

    // Fetch the CLI token from the database
    const cliToken = await this.prisma.cliSession.findUnique({
      where: {
        tokenHash: toSHA256(actualToken)
      }
    })

    // Check if the token exists
    if (!cliToken) {
      throw new UnauthorizedException(
        'Error validating CLI token: Token not found'
      )
    }

    // Check if the token is valid
    if (cliToken.expiresOn.getDate() < Date.now()) {
      throw new UnauthorizedException(
        'Error validating JWT token: Token expired'
      )
    }

    // Update the last used date of the session
    await this.prisma.cliSession.update({
      where: {
        id: cliToken.id
      },
      data: {
        lastUsedOn: new Date()
      }
    })

    return cliToken.userId
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async validateUserAccessToken(token: string): Promise<User['id']> {
    throw new UnauthorizedException('Error: Not implemented')
  }

  private async validateServiceAccountAccessToken(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: string
  ): Promise<User['id']> {
    throw new UnauthorizedException('Error: Not implemented')
  }

  private extractActualToken(token: string): string {
    if (token.startsWith('Bearer')) {
      const parts = token.split(' ')
      if (parts.length !== 2) {
        throw new UnauthorizedException('Invalid token format')
      }
      return parts[1]
    }
    if (token.startsWith('ks.')) {
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new UnauthorizedException('Invalid token format')
      }
      return parts[2]
    }
  }
}
