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
  WorkspaceMember,
  WorkspaceRole
} from '@prisma/client'
import { JsonObject } from '@prisma/client/runtime/library'

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
      | WorkspaceMember
      | ApiKey
      | Secret
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

  const baseData = {
    triggerer: data.triggerer ? data.triggerer : EventTriggerer.USER,
    severity: data.severity ? data.severity : EventSeverity.INFO,
    type: data.type,
    source: data.source,
    title: data.title,
    description: data.description,
    metadata: data.metadata,
    sourceUser: {
      connect: {
        id: data.triggeredBy.id
      }
    }
  }

  switch (data.source) {
    case EventSource.WORKSPACE: {
      const entity = data.entity as Workspace
      await prisma.event.create({
        data: {
          ...baseData,
          sourceWorkspace: data.entity
            ? {
                connect: {
                  id: entity.id
                }
              }
            : undefined
        }
      })
      break
    }
    case EventSource.PROJECT: {
      const entity = data.entity as Project
      await prisma.event.create({
        data: {
          ...baseData,
          sourceProject: data.entity
            ? { connect: { id: entity.id } }
            : undefined
        }
      })
      break
    }
    case EventSource.ENVIRONMENT: {
      const entity = data.entity as Environment
      await prisma.event.create({
        data: {
          ...baseData,
          sourceEnvironment: data.entity
            ? { connect: { id: entity.id } }
            : undefined
        }
      })
      break
    }
    case EventSource.WORKSPACE_ROLE: {
      const entity = data.entity as WorkspaceRole
      await prisma.event.create({
        data: {
          ...baseData,
          sourceWorkspaceRole: data.entity
            ? { connect: { id: entity.id } }
            : undefined
        }
      })
      break
    }
    case EventSource.WORKSPACE_MEMBER: {
      const entity = data.entity as WorkspaceMember
      await prisma.event.create({
        data: {
          ...baseData,
          sourceWorkspaceMembership: data.entity
            ? { connect: { id: entity.id } }
            : undefined
        }
      })
      break
    }
    case EventSource.API_KEY: {
      const entity = data.entity as ApiKey
      await prisma.event.create({
        data: {
          ...baseData,
          sourceApiKey: data.entity ? { connect: { id: entity.id } } : undefined
        }
      })
      break
    }
    case EventSource.SECRET: {
      const entity = data.entity as Secret
      await prisma.event.create({
        data: {
          ...baseData,
          sourceSecret: data.entity ? { connect: { id: entity.id } } : undefined
        }
      })
      break
    }
    case EventSource.USER: {
      await prisma.event.create({
        data: {
          ...baseData
        }
      })
      break
    }
    default: {
      throw new Error('Invalid event source')
    }
  }
}
