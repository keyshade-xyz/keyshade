import {
  ApiKey,
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
  WorkspaceRole
} from '@prisma/client'
import { JsonObject } from '@prisma/client/runtime/library'

export default async function createEvent(
  data: {
    triggerer?: EventTriggerer
    severity?: EventSeverity
    triggeredBy?: User
    entity?: Workspace | Project | Environment | WorkspaceRole | ApiKey | Secret
    type: EventType
    source: EventSource
    title: string
    description?: string
    metadata: JsonObject
  },
  prisma: PrismaClient
) {
  if (data.triggerer !== EventTriggerer.SYSTEM && !data.triggeredBy) {
    throw new Error('User must be provided for non-system events')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseData: any = {
    triggerer: data.triggerer ?? EventTriggerer.USER,
    severity: data.severity ?? EventSeverity.INFO,
    type: data.type,
    source: data.source,
    title: data.title,
    description: data.description ?? '',
    metadata: data.metadata
  }

  if (data.triggeredBy) {
    baseData.sourceUserId = data.triggeredBy.id
  }

  try {
    switch (data.source) {
      case EventSource.WORKSPACE: {
        if (data.entity) {
          baseData.sourceWorkspaceId = data.entity.id
        }
        break
      }
      case EventSource.PROJECT: {
        if (data.entity) {
          baseData.sourceProjectId = data.entity.id
        }
        break
      }
      case EventSource.ENVIRONMENT: {
        if (data.entity) {
          baseData.sourceEnvironmentId = data.entity.id
        }
        break
      }
      case EventSource.WORKSPACE_ROLE: {
        if (data.entity) {
          baseData.sourceWorkspaceRoleId = data.entity.id
        }
        break
      }
      case EventSource.API_KEY: {
        if (data.entity) {
          baseData.sourceApiKeyId = data.entity.id
        }
        break
      }
      case EventSource.SECRET: {
        if (data.entity) {
          baseData.sourceSecretId = data.entity.id
        }
        break
      }
      case EventSource.USER: {
        break
      }
      default: {
        throw new Error('Invalid event source')
      }
    }
  } catch (error) {
    console.error('Error creating event', data, error)
  }

  await prisma.event.create({
    data: baseData
  })
}
