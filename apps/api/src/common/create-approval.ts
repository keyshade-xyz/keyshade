import {
  ApprovalAction,
  ApprovalItemType,
  EventSource,
  EventType,
  User,
  Workspace
} from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import createEvent from './create-event'
import { ConflictException, Logger } from '@nestjs/common'

const logger = new Logger('CreateApproval')

/**
 * Given the itemType, action, itemId, userId and reason, create an approval,
 * if an approval already exists for the item, throw a ConflictException.
 * Creating an approval changes the state of the item to pending
 * @param itemType The type of item to approve
 * @param action Action performed if the approval is approved
 * @param itemId The id of the item that will undergo approval
 * @param userId The id of the user creating the approval
 * @param reason The reason for approving the item
 * @param metadata Data that the item will be updated with if approved (only applicable for UPDATE approvals)
 * @returns The created approval
 * @throws ConflictException if an approval already exists for the item
 */
export default async function createApproval(
  data: {
    itemType: ApprovalItemType
    action: ApprovalAction
    itemId: string
    workspaceId: Workspace['id']
    user: User
    reason?: string
    metadata?: Record<string, any>
  },
  prisma: PrismaService
) {
  // Check if approval already exists for this item
  await checkApprovalExists(data.itemType, data.itemId, prisma)

  // Create the approval
  const approval = await prisma.approval.create({
    data: {
      itemType: data.itemType,
      itemId: data.itemId,
      action: data.action,
      metadata: data.metadata ?? {},
      reason: data.reason,
      workspace: {
        connect: {
          id: data.workspaceId
        }
      },
      requestedBy: {
        connect: {
          id: data.user.id
        }
      }
    }
  })

  logger.log(
    `Approval for ${data.itemType} with id ${data.itemId} created by ${data.user.id}`
  )

  createEvent(
    {
      triggeredBy: data.user,
      entity: approval,
      type: EventType.APPROVAL_CREATED,
      source: EventSource.APPROVAL,
      title: `Approval for ${data.itemType} with id ${data.itemId} created`,
      metadata: {
        itemType: data.itemType,
        itemId: data.itemId,
        action: data.action,
        reason: data.reason
      }
    },
    prisma
  )

  return approval
}

/**
 * An approval is said to exist if the a record with the same itemType and itemId exists
 * and the approvedAt and rejectedAt fields are null
 * @param itemType The type of item to check for
 * @param itemId The id of the item to check for
 * @returns False if no approval exists
 * @throws ConflictException if an approval exists
 */
async function checkApprovalExists(
  itemType: ApprovalItemType,
  itemId: string,
  prisma: PrismaService
) {
  const approval = await prisma.approval.findFirst({
    where: {
      itemType,
      itemId,
      approvedAt: null,
      rejectedAt: null
    }
  })

  if (approval === null) {
    return false
  }

  if (approval.approvedAt === null && approval.rejectedAt === null) {
    throw new ConflictException(
      `Active approval for ${itemType} with id ${itemId} already exists`
    )
  }
}
