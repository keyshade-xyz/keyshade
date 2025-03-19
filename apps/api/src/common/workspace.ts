import {
  Authority,
  EventSource,
  EventType,
  User,
  Workspace
} from '@prisma/client'
import { CreateWorkspace } from '@/workspace/dto/create.workspace/create.workspace'
import { PrismaService } from '@/prisma/prisma.service'
import { Logger } from '@nestjs/common'
import { v4 } from 'uuid'
import generateEntitySlug from './slug-generator'
import { createEvent } from './event'

/**
 * Creates a new workspace and adds the user as the owner.
 * @param user The user creating the workspace
 * @param dto The workspace data
 * @param prisma The Prisma client
 * @param isDefault Whether the workspace should be the default workspace
 * @returns The created workspace
 */
export const createWorkspace = async (
  user: User,
  dto: CreateWorkspace,
  prisma: PrismaService,
  isDefault?: boolean
): Promise<Workspace> => {
  const logger = new Logger('createWorkspace')

  const workspaceId = v4()

  logger.log(
    `Creating workspace ${dto.name} (${workspaceId}) for user ${user.id}`
  )
  const createNewWorkspace = prisma.workspace.create({
    data: {
      id: workspaceId,
      slug: await generateEntitySlug(dto.name, 'WORKSPACE', prisma),
      name: dto.name,
      icon: dto.icon,
      isFreeTier: true,
      ownerId: user.id,
      isDefault,
      roles: {
        createMany: {
          data: [
            {
              name: 'Admin',
              slug: await generateEntitySlug('Admin', 'WORKSPACE_ROLE', prisma),
              authorities: [Authority.WORKSPACE_ADMIN],
              hasAdminAuthority: true,
              colorCode: '#FF0000'
            }
          ]
        }
      }
    }
  })
  logger.log(`Created workspace ${dto.name} (${workspaceId})`)

  // Add the owner to the workspace
  logger.log(
    `Assigning ownership of workspace ${dto.name} (${workspaceId}) to user ${user.id}`
  )
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
  logger.log(
    `Assigned ownership of workspace ${dto.name} (${workspaceId}) to user ${user.id}`
  )

  logger.log(
    `Executing transactions for creating workspace and assigning ownership`
  )
  const result = await prisma.$transaction([
    createNewWorkspace,
    assignOwnership
  ])
  logger.log(
    `Executed transactions for creating workspace and assigning ownership`
  )

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

  return workspace
}
