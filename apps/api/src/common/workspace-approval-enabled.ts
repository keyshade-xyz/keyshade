import { Workspace } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'

/**
 * Given a workspaceId, return whether approval workflow is enabled for a workspace
 * @param workspaceId The id of the workspace
 * @param prisma The PrismaService
 * @returns Whether approval workflow is enabled for the workspace
 */
export default async function workspaceApprovalEnabled(
  workspaceId: Workspace['id'],
  prisma: PrismaService
): Promise<boolean> {
  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId
    },
    select: {
      approvalEnabled: true
    }
  })

  return workspace.approvalEnabled
}
