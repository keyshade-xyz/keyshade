import { Authority, PrismaClient, User, Workspace } from '@prisma/client'
import getCollectiveWorkspaceAuthorities from './get-collective-workspace-authorities'
import { NotFoundException, UnauthorizedException } from '@nestjs/common'

export default async function getWorkspaceWithAuthority(
  userId: User['id'],
  workspaceId: Workspace['id'],
  authority: Authority,
  prisma: PrismaClient
): Promise<Workspace> {
  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId
    }
  })

  // Check if the workspace exists or not
  if (!workspace) {
    throw new NotFoundException(`Workspace with id ${workspaceId} not found`)
  }

  const permittedAuthorities = await getCollectiveWorkspaceAuthorities(
    workspaceId,
    userId,
    prisma
  )

  // Check if the user has the authority to perform the action
  if (
    !permittedAuthorities.has(authority) &&
    !permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
  ) {
    throw new UnauthorizedException(
      `User ${userId} does not have the required authorities to perform the action`
    )
  }

  return workspace
}
