import { Controller, Get, Param, Query } from '@nestjs/common'
import { EventService } from './event.service'
import { Authority, EventSeverity, EventSource } from '@prisma/client'
import { CurrentUser } from '@/decorators/user.decorator'
import { RequiredApiKeyAuthorities } from '@/decorators/required-api-key-authorities.decorator'
import { AuthenticatedUser } from '@/user/user.types'

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get(':workspaceSlug')
  @RequiredApiKeyAuthorities(Authority.READ_EVENT)
  async getEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceSlug') workspaceSlug: string,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
    @Query('severity') severity: EventSeverity,
    @Query('source') source: EventSource
  ) {
    return await this.eventService.getEvents(
      user,
      workspaceSlug,
      page,
      limit,
      search,
      severity,
      source
    )
  }
}
