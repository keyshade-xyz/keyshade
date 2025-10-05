import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { AuthenticatedUser } from '@/user/user.types'
import { CliSessionResponse } from '@/session/session.types'
import { CliSession } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { sDecrypt } from '@keyshade/common'
import { constructErrorBody } from '@/common/util'

@Injectable()
export class CliSessionService {
  private readonly logger = new Logger(CliSessionService.name)

  constructor(private readonly prisma: PrismaService) {}

  public async getAllSessionsOfUser(
    user: AuthenticatedUser
  ): Promise<CliSessionResponse[]> {
    this.logger.log(`User ${user.id} attempted to fetch all CLI sessions`)

    // Fetch all CLI sessions of the user
    this.logger.log(`Fetching all CLI sessions of ${user.id}`)
    const cliSessions = await this.prisma.cliSession.findMany({
      where: {
        userId: user.id
      },
      include: {
        deviceDetail: true
      }
    })
    this.logger.log(`Fetched ${cliSessions.length} CLI sessions`)

    // Convert the CLI sessions to response format
    this.logger.log(`Mapping CLI sessions to response...`)
    const cliSessionResponses: CliSessionResponse[] = cliSessions.map(
      (cliSession) => ({
        id: cliSession.id,
        createdAt: cliSession.createdAt,
        updatedAt: cliSession.updatedAt,
        lastUsedOn: cliSession.lastUsedOn,
        deviceDetail: {
          id: cliSession.deviceDetail.id,
          ipAddress: sDecrypt(cliSession.deviceDetail.encryptedIpAddress),
          os: cliSession.deviceDetail.os,
          platform: cliSession.deviceDetail.platform,
          city: cliSession.deviceDetail.city,
          country: cliSession.deviceDetail.country,
          region: cliSession.deviceDetail.region
        }
      })
    )
    this.logger.log(`Mapped ${cliSessionResponses.length} CLI sessions`)

    return cliSessionResponses
  }

  public async revokeSession(
    user: AuthenticatedUser,
    sessionId: CliSession['id']
  ): Promise<void> {
    this.logger.log(
      `User ${user.id} attempted to revoke CLI session ${sessionId}`
    )

    // Check if the user owns the session
    this.logger.log(`Checking if user ${user.id} owns CLI session ${sessionId}`)
    const cliSession = await this.prisma.cliSession.findUnique({
      where: {
        id: sessionId
      }
    })
    if (!cliSession) {
      this.logger.warn(`Session ${sessionId} not found`)
      throw new NotFoundException(
        constructErrorBody(
          'Session not found',
          'The session you specified does not exist'
        )
      )
    }
    if (cliSession.userId !== user.id) {
      this.logger.warn(
        `Session ${sessionId} does not belong to user ${user.id}`
      )
      throw new UnauthorizedException(
        constructErrorBody(
          'Session not accessible',
          'You are not allowed to access this session!'
        )
      )
    }

    // Delete the session
    this.logger.log(`Deleting CLI session ${sessionId}...`)
    await this.prisma.cliSession.delete({
      where: {
        id: sessionId
      }
    })
    this.logger.log(`Deleted CLI session ${sessionId}`)
  }
}
