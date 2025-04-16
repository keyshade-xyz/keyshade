import { InternalServerErrorException, Logger } from '@nestjs/common'
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
  Integration
} from '@prisma/client'
import { JsonObject } from '@prisma/client/runtime/library'
import IntegrationFactory from '@/integration/plugins/factory/integration.factory'
import { EventService } from '@/event/event.service'
import { AuthenticatedUser } from '@/user/user.types'
import { constructErrorBody } from './util'

/**
 * Creates a new event and saves it to the database.
 *
 * @param data The data for the event.
 * @param prisma The Prisma client.
 *
 * @throws {InternalServerErrorException} If the user is not provided for non-system events.
 */
export const createEvent = async (
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
      | Integration
    type: EventType
    source: EventSource
    title: string
    workspaceId: string
    description?: string
    metadata: JsonObject
  },
  prisma: PrismaClient
): Promise<void> => {
  const logger = new Logger('CreateEvent')

  logger.log(`Creating event with type ${data.type}`)

  if (data.triggerer !== EventTriggerer.SYSTEM && !data.triggeredBy) {
    const errorMessage = 'User must be provided for non-system events'
    logger.error(errorMessage)
    throw new InternalServerErrorException(
      constructErrorBody('Error creating event', errorMessage)
    )
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

  if (data.entity) {
    logger.log(`Emitting event for entity with id ${data.entity.id}`)
    // We need to fetch all the integrations that will be triggered for this event.
    // To do that, we will need to take the following steps:
    // 1. Based on the entity, get the projectId and environmentId
    // 2. Fetch the integration entities using the following query:
    //    a. Get all integrations that have the same projectId and environmentId and workspaceId
    //    b. Get all integrations that have the same projectId and workspaceId
    //    c. Get all integrations that have the same workspaceId
    // 3. For each integration entity, check if the notifyOn array includes the event type
    // 4. If it does, call the emitEvent function with the data and metadata

    // Fetch the projectId and environmentId
    let projectId: string | undefined, environmentId: string | undefined
    switch (data.source) {
      case EventSource.WORKSPACE:
        break

      case EventSource.PROJECT:
        projectId = data.entity.id
        break

      case EventSource.ENVIRONMENT:
        const environment = data.entity as Environment
        projectId = environment.projectId
        environmentId = environment.id
        break

      case EventSource.WORKSPACE_ROLE:
        break

      case EventSource.SECRET:
        const secret = data.entity as Secret
        projectId = secret.projectId
        break

      case EventSource.VARIABLE:
        const variable = data.entity as Variable
        projectId = variable.projectId
        break

      case EventSource.INTEGRATION:
        break
      default:
        throw new InternalServerErrorException('Unsupported event source')
    }

    // Create a set to store the integrations
    // const integrations = new Set<BaseIntegration>()
    const integrationEntities = await prisma.integration.findMany({
      where: {
        OR: [
          {
            projectId,
            environmentId,
            workspaceId: data.workspaceId
          },
          {
            projectId,
            workspaceId: data.workspaceId
          },
          {
            workspaceId: data.workspaceId
          }
        ],
        notifyOn: {
          has: data.type
        }
      }
    })

    logger.log(
      `Found ${integrationEntities.length} integrations. Emitting events...`
    )

    // Emit the event for each integration
    for (const integration of integrationEntities) {
      logger.log(
        `Emitting event for integration with id ${integration.id} and type ${integration.type}`
      )
      const integrationInstance = IntegrationFactory.createIntegration(
        integration.type
      )
      integrationInstance.emitEvent(
        {
          entity: data.entity,
          source: data.source,
          eventType: data.type,
          title: data.title,
          description: data.description
        },
        integration.metadata
      )
      logger.log(`Event emitted for integration with id ${integration.id}`)
    }
  }
}

/**
 * Fetches events from the event service. It calls the getEvents method on the
 * event service with the provided parameters.
 *
 * @param eventService The event service to call the getEvents method on.
 * @param user The user to fetch events for.
 * @param workspaceSlug The id of the workspace to fetch events for.
 * @param source The source of the events to fetch. If undefined, all sources are fetched.
 * @param severity The severity of the events to fetch. If undefined, all severities are fetched.
 * @returns A promise that resolves to the events fetched from the event service.
 */
export const fetchEvents = async (
  eventService: EventService,
  user: AuthenticatedUser,
  workspaceSlug: string,
  source?: EventSource,
  severity?: EventSeverity
): Promise<any> => {
  const logger = new Logger('FetchEvents')

  logger.log(`User ${user.id} fetched events for workspace ${workspaceSlug}`)
  logger.log(`Source: ${source}, Severity: ${severity}`)
  const events = await eventService.getEvents(
    user,
    workspaceSlug,
    0,
    10,
    '',
    severity,
    source
  )

  logger.log(`Fetched ${events.metadata.totalCount} events`)
  return events
}
