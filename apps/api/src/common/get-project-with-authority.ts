import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { Authority, PrismaClient, Project, User } from '@prisma/client'
import getCollectiveProjectAuthorities from './get-collective-project-authorities'
import { ProjectWithSecrets } from '../project/project.types'

export default async function getProjectWithAuthority(
  userId: User['id'],
  projectId: Project['id'],
  authority: Authority,
  prisma: PrismaClient
): Promise<ProjectWithSecrets> {
  // Fetch the project
  let project: ProjectWithSecrets

  // Fetch the project
  try {
    project = await prisma.project.findUnique({
      where: {
        id: projectId
      },
      include: {
        secrets: true
      }
    })
  } catch (error) {
    /* empty */
  }

  // If the project is not found, throw an error
  if (!project) {
    throw new NotFoundException(`Project with id ${projectId} not found`)
  }

  // Get the authorities of the user in the workspace with the project
  const permittedAuthorities = await getCollectiveProjectAuthorities(
    userId,
    project,
    prisma
  )

  // If the user does not have the required authority, or is not a workspace admin, throw an error
  if (
    !permittedAuthorities.has(authority) &&
    !permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
  ) {
    throw new UnauthorizedException(
      `User with id ${userId} does not have the authority in the project with id ${projectId}`
    )
  }

  // If the project is pending creation, only the user who created the project, a workspace admin or
  // a user with the MANAGE_APPROVALS authority can fetch the project
  if (
    project.pendingCreation &&
    !permittedAuthorities.has(Authority.WORKSPACE_ADMIN) &&
    !permittedAuthorities.has(Authority.MANAGE_APPROVALS) &&
    project.lastUpdatedById !== userId
  ) {
    throw new BadRequestException(
      `The project with id ${projectId} is pending creation and cannot be fetched by the user with id ${userId}`
    )
  }

  return project
}
