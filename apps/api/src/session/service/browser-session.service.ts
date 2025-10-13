import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthenticatedUser } from '@/user/user.types'
import { BrowserSessionResponse } from '@/session/session.types'
import { sDecrypt } from '@keyshade/common'
import { BrowserSession } from '@prisma/client'
import { constructErrorBody } from '@/common/util'

@Injectable()
export class BrowserSessionService {
  private readonly logger = new Logger(BrowserSessionService.name)

  constructor(private readonly prisma: PrismaService) {}

  public async getAllBrowserSessions(
    user: AuthenticatedUser
  ): Promise<BrowserSessionResponse[]> {
    this.logger.log(`User ${user.id} attempted to fetch all browser sessions`)

    // Fetch all browser sessions of the user
    this.logger.log(`Fetching all browser sessions of ${user.id}`)
    const browserSessions = await this.prisma.browserSession.findMany({
      where: {
        userId: user.id
      },
      include: {
        deviceDetail: true
      }
    })
    this.logger.log(`Fetched ${browserSessions.length} browser sessions`)

    // Convert the browser sessions to response format
    this.logger.log(`Mapping browser sessions to response...`)
    const browserSessionResponses: BrowserSessionResponse[] =
      browserSessions.map((browserSession) => ({
        id: browserSession.id,
        createdAt: browserSession.createdAt,
        updatedAt: browserSession.updatedAt,
        lastUsedOn: browserSession.lastUsedOn,
        deviceDetail: {
          id: browserSession.deviceDetail.id,
          ipAddress: sDecrypt(browserSession.deviceDetail.encryptedIpAddress),
          os: browserSession.deviceDetail.os,
          agent: browserSession.deviceDetail.agent,
          city: browserSession.deviceDetail.city,
          country: browserSession.deviceDetail.country,
          region: browserSession.deviceDetail.region
        }
      }))
    this.logger.log(`Mapped ${browserSessionResponses.length} browser sessions`)

    return browserSessionResponses
  }

  public async revokeBrowserSession(
    user: AuthenticatedUser,
    sessionId: BrowserSession['id']
  ): Promise<void> {
    this.logger.log(
      `User ${user.id} attempted to revoke browser session ${sessionId}`
    )

    // Check if the user owns the session
    this.logger.log(
      `Checking if user ${user.id} owns browser session ${sessionId}`
    )
    const browserSession = await this.prisma.browserSession.findUnique({
      where: {
        id: sessionId
      }
    })
    if (!browserSession) {
      this.logger.warn(`Session ${sessionId} not found`)
      throw new NotFoundException(
        constructErrorBody(
          'Session not found',
          'The session you specified does not exist'
        )
      )
    }
    if (browserSession.userId !== user.id) {
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
    this.logger.log(`Deleting browser session ${sessionId}...`)
    await this.prisma.browserSession.delete({
      where: {
        id: sessionId
      }
    })
    this.logger.log(`Deleted browser session ${sessionId}`)
  }
}
