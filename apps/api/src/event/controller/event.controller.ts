import { Controller, Get, Query } from '@nestjs/common'
import { EventService } from '../service/event.service'
import { Authority, EventSeverity, User } from '@prisma/client'
import { CurrentUser } from '../../decorators/user.decorator'
import { RequiredApiKeyAuthorities } from '../../decorators/required-api-key-authorities.decorator'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('event')
@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @RequiredApiKeyAuthorities(Authority.READ_EVENT)
  async getEvents(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
    @Query('severity') severity: EventSeverity,
    @Query('workspaceId') workspaceId: string,
    @Query('projectId') projectId: string,
    @Query('environmentId') environmentId: string,
    @Query('secretId') secretId: string,
    @Query('apiKeyId') apiKeyId: string,
    @Query('workspaceRoleId') workspaceRoleId: string
  ) {
    return this.eventService.getEvents(
      user,
      {
        workspaceId,
        projectId,
        environmentId,
        secretId,
        apiKeyId,
        workspaceRoleId
      },
      page,
      limit,
      search,
      severity
    )
  }
}
