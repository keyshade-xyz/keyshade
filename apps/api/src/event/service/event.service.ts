import { BadRequestException, Injectable } from '@nestjs/common'
<<<<<<< HEAD
import {
  Authority,
  EventSeverity,
  EventSource,
  User,
  Workspace
} from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthorityCheckerService } from '@/common/authority-checker.service'
import { paginate } from '@/common/paginate'
import { limitMaxItemsPerPage } from '@/common/util'
=======
import { Authority, EventSeverity, EventSource, User } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { AuthorityCheckerService } from '../../common/authority-checker.service'
>>>>>>> 6ac6f14 (Revert "Fix: merge conflicts")

@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityCheckerService: AuthorityCheckerService
  ) {}

  async getEvents(
    user: User,
    workspaceSlug: Workspace['slug'],
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
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.READ_EVENT],
        prisma: this.prisma
      })
    const workspaceId = workspace.id

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
<<<<<<< HEAD
    const items = await this.prisma.event.findMany(query)

    //calculate metadata for pagination
    const totalCount = await this.prisma.event.count({
      where: query.where
    })

    const metadata = paginate(
      totalCount,
      `/event/${workspaceSlug}`,
      {
        page,
        limit: limitMaxItemsPerPage(limit),
        search
      },
      { source }
    )

    return { items, metadata }
=======
    return await this.prisma.event.findMany(query)
>>>>>>> 6ac6f14 (Revert "Fix: merge conflicts")
  }
}
