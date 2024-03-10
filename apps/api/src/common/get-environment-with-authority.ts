import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { Authority, Environment, PrismaClient, User } from '@prisma/client'
import getCollectiveProjectAuthorities from './get-collective-project-authorities'
import { EnvironmentWithProject } from 'src/environment/environment.types'

export default async function getEnvironmentWithAuthority(
  userId: User['id'],
  environmentId: Environment['id'],
  authority: Authority,
  prisma: PrismaClient
): Promise<EnvironmentWithProject> {
  // Fetch the environment
  let environment: EnvironmentWithProject

  try {
    environment = await prisma.environment.findUnique({
      where: {
        id: environmentId
      },
      include: {
        project: true
      }
    })
  } catch (e) {
    /* empty */
  }

  if (!environment) {
    throw new NotFoundException(
      `Environment with id ${environmentId} not found`
    )
  }

  const permittedAuthorities = await getCollectiveProjectAuthorities(
    userId,
    environment.project,
    prisma
  )

  // Check if the user has the required authorities
  if (
    !permittedAuthorities.has(authority) &&
    !permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
  ) {
    throw new UnauthorizedException(
      `User ${userId} does not have the required authorities`
    )
  }

  // If the environment is pending creation, only the user who created the environment, a workspace admin or
  // a user with the MANAGE_APPROVALS authority can fetch the environment
  if (
    environment.pendingCreation &&
    !permittedAuthorities.has(Authority.WORKSPACE_ADMIN) &&
    !permittedAuthorities.has(Authority.MANAGE_APPROVALS) &&
    environment.lastUpdatedById !== userId
  ) {
    throw new BadRequestException(
      `The environment with id ${environmentId} is pending creation and cannot be fetched by the user with id ${userId}`
    )
  }

  return environment
}
