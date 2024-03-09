import { Logger } from '@nestjs/common'
import {
  Environment,
  EventSeverity,
  EventTriggerer,
  EventType,
  EventSource,
  PrismaClient,
  Project,
  Secret,
  User,
  Workspace,
  WorkspaceRole,
  Variable,
  Approval
} from '@prisma/client'
import { JsonObject } from '@prisma/client/runtime/library'

const logger = new Logger('CreateEvent')

export default async function createEvent(
  data: {
    triggerer?: EventTriggerer
    severity?: EventSeverity
    triggeredBy?: User
    entity?:
      | Workspace
      | Project
      | Environment
      | WorkspaceRole
      | Secret
      | Variable
      | Approval
    type: EventType
    source: EventSource
    title: string
    workspaceId: string
    description?: string
    metadata: JsonObject
  },
  prisma: PrismaClient
) {
  if (data.triggerer !== EventTriggerer.SYSTEM && !data.triggeredBy) {
    throw new Error('User must be provided for non-system events')
  }

  const event = await prisma.event.create({
    data: {
      triggerer: data.triggerer ?? EventTriggerer.USER,
      severity: data.severity ?? EventSeverity.INFO,
      type: data.type,
      source: data.source,
      title: data.title,
      description: data.description ?? '',
      metadata: data.metadata,
      userId: data.triggeredBy?.id,
      itemId: data.entity?.id,
      workspaceId: data.workspaceId
    }
  })

  logger.log(`Event with id ${event.id} created`)
}
