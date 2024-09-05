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
      | Integration
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
    throw new InternalServerErrorException(
      'User must be provided for non-system events'
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

  if (data.entity) {
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

    // Emit the event for each integration
    for (const integration of integrationEntities) {
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
    }
  }

  logger.log(`Event with id ${event.id} created`)
}
