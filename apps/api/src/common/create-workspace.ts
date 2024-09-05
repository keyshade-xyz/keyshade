import { Authority, EventSource, EventType, User } from '@prisma/client'
import createEvent from './create-event'
import { CreateWorkspace } from '@/workspace/dto/create.workspace/create.workspace'
import { v4 } from 'uuid'
import { PrismaService } from '@/prisma/prisma.service'
import { Logger } from '@nestjs/common'

export default async function createWorkspace(
  user: User,
  dto: CreateWorkspace,
  prisma: PrismaService,
  isDefault?: boolean
) {
  const workspaceId = v4()
  const logger = new Logger('createWorkspace')

  const createNewWorkspace = prisma.workspace.create({
    data: {
      id: workspaceId,
      name: dto.name,
      description: dto.description,
      isFreeTier: true,
      ownerId: user.id,
      isDefault,
      roles: {
        createMany: {
          data: [
            {
              name: 'Admin',
              authorities: [Authority.WORKSPACE_ADMIN],
              hasAdminAuthority: true,
              colorCode: '#FF0000'
            }
          ]
        }
      }
    }
  })

  // Add the owner to the workspace
  const assignOwnership = prisma.workspaceMember.create({
    data: {
      workspace: {
        connect: {
          id: workspaceId
        }
      },
      user: {
        connect: {
          id: user.id
        }
      },
      invitationAccepted: true,
      roles: {
        create: {
          role: {
            connect: {
              workspaceId_name: {
                workspaceId: workspaceId,
                name: 'Admin'
              }
            }
          }
        }
      }
    }
  })

  const result = await prisma.$transaction([
    createNewWorkspace,
    assignOwnership
  ])
  const workspace = result[0]

  await createEvent(
    {
      triggeredBy: user,
      entity: workspace,
      type: EventType.WORKSPACE_CREATED,
      source: EventSource.WORKSPACE,
      title: `Workspace created`,
      metadata: {
        workspaceId: workspace.id,
        name: workspace.name
      },
      workspaceId: workspace.id
    },
    prisma
  )

  logger.log(`Created workspace ${dto.name} (${workspaceId})`)

  return workspace
}
