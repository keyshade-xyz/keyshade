import { BadRequestException, Injectable } from '@nestjs/common'
import { Authority, EventSeverity, EventSource, User } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { AuthorityCheckerService } from '../../common/authority-checker.service'

@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityCheckerService: AuthorityCheckerService
  ) {}

  async getEvents(
    user: User,
    workspaceId: string,
    page: number,
    limit: number,
    search: string,
    severity?: EventSeverity,
    source?: EventSource
  ) {
    if (severity && !Object.values(EventSeverity).includes(severity)) {
      throw new BadRequestException('Invalid "severity" value')
    }

    if (source && !Object.values(EventSource).includes(source)) {
      throw new BadRequestException('Invalid "source" value')
    }

    // Check for workspace authority
    await this.authorityCheckerService.checkAuthorityOverWorkspace({
      userId: user.id,
      entity: { id: workspaceId },
      authority: Authority.READ_EVENT,
      prisma: this.prisma
    })

    const query = {
      where: {
        workspaceId,
        title: {
          contains: search
        }
      },
      skip: page * limit,
      take: Math.min(limit, 30),
      orderBy: {
        timestamp: 'desc'
      }
    }

    if (source) {
      query.where['source'] = source
    }

    // @ts-expect-error - Prisma does not have a type for severity
    return await this.prisma.event.findMany(query)
  }
}
