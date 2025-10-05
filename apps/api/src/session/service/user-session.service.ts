import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthenticatedUser } from '@/user/user.types'
import { UserSessionResponse } from '@/session/session.types'
import { sDecrypt } from '@keyshade/common'
import { UserSession } from '@prisma/client'
import { constructErrorBody } from '@/common/util'

@Injectable()
export class UserSessionService {
  private readonly logger = new Logger(UserSessionService.name)

  constructor(private readonly prisma: PrismaService) {}

  public async getAllSessionsOfUser(
    user: AuthenticatedUser
  ): Promise<UserSessionResponse[]> {
    this.logger.log(`User ${user.id} attempted to fetch all user sessions`)

    // Fetch all user sessions of the user
    this.logger.log(`Fetching all user sessions of ${user.id}`)
    const userSessions = await this.prisma.userSession.findMany({
      where: {
        userId: user.id
      },
      include: {
        deviceDetail: true
      }
    })
    this.logger.log(`Fetched ${userSessions.length} user sessions`)

    // Convert the user sessions to response format
    this.logger.log(`Mapping user sessions to response...`)
    const userSessionResponses: UserSessionResponse[] = userSessions.map(
      (userSession) => ({
        id: userSession.id,
        createdAt: userSession.createdAt,
        updatedAt: userSession.updatedAt,
        lastUsedOn: userSession.lastUsedOn,
        deviceDetail: {
          id: userSession.deviceDetail.id,
          ipAddress: sDecrypt(userSession.deviceDetail.encryptedIpAddress),
          os: userSession.deviceDetail.os,
          platform: userSession.deviceDetail.platform,
          city: userSession.deviceDetail.city,
          country: userSession.deviceDetail.country,
          region: userSession.deviceDetail.region
        }
      })
    )
    this.logger.log(`Mapped ${userSessionResponses.length} user sessions`)

    return userSessionResponses
  }

  public async revokeSession(
    user: AuthenticatedUser,
    sessionId: UserSession['id']
  ): Promise<void> {
    this.logger.log(
      `User ${user.id} attempted to revoke user session ${sessionId}`
    )

    // Check if the user owns the session
    this.logger.log(
      `Checking if user ${user.id} owns user session ${sessionId}`
    )
    const userSession = await this.prisma.userSession.findUnique({
      where: {
        id: sessionId
      }
    })
    if (!userSession) {
      this.logger.warn(`Session ${sessionId} not found`)
      throw new NotFoundException(
        constructErrorBody(
          'Session not found',
          'The session you specified does not exist'
        )
      )
    }
    if (userSession.userId !== user.id) {
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
    this.logger.log(`Deleting user session ${sessionId}...`)
    await this.prisma.userSession.delete({
      where: {
        id: sessionId
      }
    })
    this.logger.log(`Deleted user session ${sessionId}`)
  }
}
