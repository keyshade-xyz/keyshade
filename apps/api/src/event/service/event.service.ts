import { BadRequestException, Injectable } from '@nestjs/common'
import { Authority, EventSeverity, EventSource, User } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { AuthorityCheckerService } from '../../common/authority-checker.service'
import { paginate } from '../../common/paginate'
import { limitMaxItemsPerPage } from '../../common/limit-max-items-per-page'

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
      authorities: [Authority.READ_EVENT],
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
      take: limitMaxItemsPerPage(limit),

      orderBy: {
        timestamp: 'desc'
      }
    }

    if (source) {
      query.where['source'] = source
    }

    // @ts-expect-error - Prisma does not have a type for severity
    const items = await this.prisma.event.findMany(query)

    //calculate metadata for pagination
    const totalCount = await this.prisma.event.count({
      where: query.where
    })

    const metadata = paginate(
      totalCount,
      `/event/${workspaceId}`,
      {
        page,
        limit: limitMaxItemsPerPage(limit),
        search
      },
      { source }
    )

    return { items, metadata }
  }
}
