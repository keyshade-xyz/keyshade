import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  UnauthorizedException
} from '@nestjs/common'
import { User } from '@prisma/client'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '@/prisma/prisma.service'
import { toSHA256 } from '@/common/cryptography'
import { DeviceDetail } from '@/auth/auth.types'
import * as crypto from 'crypto'
import dayjs from 'dayjs'
import { constructErrorBody } from '@/common/util'

export enum TokenType {
  BEARER = 'Bearer',
  CLI_ACCESS_TOKEN = 'CLI',
  PERSONAL_ACCESS_TOKEN = 'PersonalAccessToken',
  SERVICE_ACCOUNT_ACCESS_TOKEN = 'ServiceAccountAccessToken'
}

@Injectable()
export class TokenService implements OnModuleInit {
  private readonly logger = new Logger(TokenService.name)

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async onModuleInit(): Promise<void> {}

  public async deleteExpiredTokens(): Promise<void> {
    // Delete expired CLI tokens
    this.logger.log(`Cleaning up expired CLI tokens...`)
    const cliTokensDeleted = await this.prisma.cliToken.deleteMany({
      where: {
        expiresOn: {
          lt: new Date()
        }
      }
    })
    this.logger.log(`Deleted ${cliTokensDeleted.count} expired CLI tokens.`)
  }

  public async generateBearerToken(
    userId: User['id'],
    deviceDetails: DeviceDetail
  ): Promise<string> {
    // Generate the token
    const bearerToken = await this.jwt.signAsync({ id: userId })

    // Save the session to the database
  }

  public async generateCliAccessToken(
    userId: User['id'],
    deviceDetail: DeviceDetail
  ): Promise<string> {
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
      const cliToken = await this.prisma.cliToken.create({
        data: {
          hash: secureRandomHash,
          user: {
            connect: {
              id: userId
            }
          },
          expiresOn: dayjs().add(6, 'months').toDate(), // Convert to Date object
          deviceDetail: {
            create: {
              ...deviceDetail
            }
          }
        }
      })
      this.logger.log(
        `Saved CLI token ${secureRandomHash} for user ${userId}: ${cliToken.id}`
      )
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

    return token
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

    // Validate the token payload against the user session
    const payload = await this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET
    })
    if (!payload) {
      throw new UnauthorizedException(
        'Error validating JWT token: Invalid payload'
      )
    }

    return payload.id
  }

  private async validateCliAccessToken(token: string): Promise<User['id']> {
    // Extract the actual token from the complete token
    const actualToken = this.extractActualToken(token)

    // Fetch the CLI token from the database
    const cliToken = await this.prisma.cliToken.findUnique({
      where: {
        hash: toSHA256(actualToken)
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

    return cliToken.userId
  }

  private async validateUserAccessToken(token: string): Promise<User['id']> {
    throw new UnauthorizedException('Error: Not implemented')
  }

  private async validateServiceAccountAccessToken(
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
