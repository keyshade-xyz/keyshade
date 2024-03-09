import { EventSeverity, EventSource, User } from '@prisma/client'
import { EventService } from 'src/event/service/event.service'

export default async function fetchEvents(
  eventService: EventService,
  user: User,
  workspaceId: string,
  source?: EventSource,
  severity?: EventSeverity
): Promise<any> {
  return await eventService.getEvents(
    user,
    workspaceId,
    0,
    10,
    '',
    severity,
    source
  )
}
