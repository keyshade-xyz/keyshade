import { BadRequestException, Injectable } from '@nestjs/common'
import { Authority, EventSeverity, EventSource, User } from '@prisma/client'
import getWorkspaceWithAuthority from '../../common/get-workspace-with-authority'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

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
    await getWorkspaceWithAuthority(
      user.id,
      workspaceId,
      Authority.READ_EVENT,
      this.prisma
    )

    const query = {
      where: {
        workspaceId,
        title: {
          contains: search
        }
      },
      skip: page * limit,
      take: limit,
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
