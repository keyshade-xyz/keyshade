import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import {
  Authority,
  EventSeverity,
  EventSource,
  Workspace
} from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { paginate } from '@/common/paginate'
import { constructErrorBody, limitMaxItemsPerPage } from '@/common/util'
import { AuthenticatedUser } from '@/user/user.types'

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService
  ) {}

  async getEvents(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    page: number,
    limit: number,
    search: string,
    severity?: EventSeverity,
    source?: EventSource
  ) {
    this.logger.log(
      `User ${user.id} fetched events for workspace ${workspaceSlug}`
    )

    if (severity && !Object.values(EventSeverity).includes(severity)) {
      const errorMessage = 'Invalid "severity" value'
      this.logger.error(errorMessage)
      throw new BadRequestException(
        constructErrorBody('Invalid value', errorMessage)
      )
    }

    if (source && !Object.values(EventSource).includes(source)) {
      throw new BadRequestException(
        constructErrorBody('Invalid value', 'Invalid "source" value')
      )
    }

    // Check for workspace authority
    this.logger.log(
      `Checking user ${user.id} access to workspace ${workspaceSlug}`
    )
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.READ_EVENT]
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

    this.logger.log(
      `Fetching events for workspace ${workspaceSlug} with query: ${JSON.stringify(
        query
      )}`
    )
    // @ts-expect-error - Prisma does not have a type for severity
    const items = await this.prisma.event.findMany(query)
    this.logger.log(
      `Fetched ${items.length} events for workspace ${workspaceSlug}`
    )

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
  }
}
