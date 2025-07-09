import {
  Authority,
  EventSource,
  EventType,
  User,
  Workspace
} from '@prisma/client'
import { CreateWorkspace } from '@/workspace/dto/create.workspace/create.workspace'
import { PrismaService } from '@/prisma/prisma.service'
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common'
import { v4 } from 'uuid'
import { createEvent } from './event'
import {
  WorkspaceWithLastUpdateBy,
  WorkspaceWithLastUpdatedByAndOwner,
  WorkspaceWithLastUpdatedByAndOwnerAndSubscription
} from '@/workspace/workspace.types'
import SlugGenerator from './slug-generator.service'
import { constructErrorBody } from './util'

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
  slugGenerator: SlugGenerator,
  isDefault?: boolean
): Promise<WorkspaceWithLastUpdatedByAndOwnerAndSubscription> => {
  const logger = new Logger('createWorkspace')

  const workspaceId = v4()
  const workspaceSlug = await slugGenerator.generateEntitySlug(
    dto.name,
    'WORKSPACE'
  )
  const workspaceAdminRoleSlug = await slugGenerator.generateEntitySlug(
    'Admin',
    'WORKSPACE_ROLE'
  )

  logger.log(
    `Creating workspace ${dto.name} (${workspaceSlug}) for user ${user.id} and admin role ${workspaceAdminRoleSlug}`
  )

  const createNewWorkspace = prisma.workspace.create({
    data: {
      id: workspaceId,
      slug: workspaceSlug,
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
              slug: workspaceAdminRoleSlug,
              authorities: [Authority.WORKSPACE_ADMIN],
              hasAdminAuthority: true,
              colorCode: '#FF0000'
            }
          ]
        }
      },
      subscription: {
        create: {
          userId: user.id
        }
      }
    },
    include: {
      lastUpdatedBy: {
        select: {
          id: true,
          name: true,
          profilePictureUrl: true
        }
      },
      subscription: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePictureUrl: true
            }
          }
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

  logger.log(
    `Executing transactions for creating workspace ${dto.name} (${workspaceSlug}) and assigning ownership ${workspaceAdminRoleSlug} to user ${user.id}`
  )
  const result = await prisma.$transaction([
    createNewWorkspace,
    assignOwnership
  ])
  logger.log(
    `Assigned ownership of workspace ${dto.name} (${workspaceId}) to user ${user.id}`
  )
  logger.log(
    `Created workspace ${dto.name} (${workspaceSlug}) for user ${user.id}`
  )
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

  return {
    ...workspace,
    lastUpdatedBy: {
      id: user.id,
      name: user.name,
      profilePictureUrl: user.profilePictureUrl
    },
    ownedBy: {
      id: user.id,
      name: user.name,
      profilePictureUrl: user.profilePictureUrl,
      ownedSince: result[1].createdOn
    }
  }
}

/**
 * Adds the owner's details to the workspace, including the owner's ID,
 * name, profile picture URL, and when they became the owner.
 *
 * @param workspace The workspace to get the owner's details for
 * @returns The workspace with the owner's details
 */
export async function associateWorkspaceOwnerDetails(
  workspace: WorkspaceWithLastUpdateBy,
  prisma: PrismaService
): Promise<WorkspaceWithLastUpdatedByAndOwner> {
  const logger = new Logger('associateWorkspaceOwnerDetails')

  logger.log(`Associating owner details for workspace ${workspace.slug}`)

  // Get owner
  logger.log(`Fetching owner for workspace ${workspace.slug}`)
  const owner = await prisma.user.findUnique({
    where: {
      id: workspace.ownerId
    },
    select: {
      id: true,
      name: true,
      profilePictureUrl: true
    }
  })
  logger.log(`User ${owner.id} is the owner of workspace ${workspace.slug}`)

  // Get membership
  logger.log(`Fetching membership for workspace ${workspace.slug}`)
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: owner.id
      }
    }
  })
  logger.log(
    `User ${owner.id} is the owner of workspace ${workspace.slug} since ${membership.createdOn}`
  )

  return {
    ...workspace,
    ownedBy: {
      id: owner.id,
      name: owner.name,
      profilePictureUrl: owner.profilePictureUrl,
      ownedSince: membership.createdOn
    }
  }
}

/**
 * Checks if a workspace is disabled.
 *
 * @param workspaceId - The ID of the workspace to check.
 * @param prisma - The Prisma service used to access the database.
 * @param logMessage - Optional custom log message to use if the workspace is disabled.
 * @throws NotFoundException if the workspace is not found.
 * @throws BadRequestException if the workspace is disabled.
 */
export async function checkForDisabledWorkspace(
  workspaceId: Workspace['id'],
  prisma: PrismaService,
  logMessage?: string
) {
  const logger = new Logger('checkForDisabledWorkspace')

  logger.log(`Fetching workspace ${workspaceId} to check if it is disabled`)
  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId
    }
  })

  if (!workspace) {
    throw new NotFoundException(
      constructErrorBody(
        'Workspace not found',
        'The specified workspace was not found'
      )
    )
  }

  if (workspace.isDisabled) {
    logger.log(
      logMessage ||
        `Attempted to perform a forbidden operation on a disabled workspace ${workspaceId}`
    )
    throw new BadRequestException(
      constructErrorBody(
        'This workspace has been disabled',
        'To use the workspace again, remove the previum resources, or upgrade to a paid plan'
      )
    )
  }
}
