import { NotFoundException, UnauthorizedException } from '@nestjs/common'
import {
  Authority,
  Environment,
  PrismaClient,
  Project,
  User
} from '@prisma/client'
import getCollectiveProjectAuthorities from './get-collective-project-authorities'

export default async function getEnvironmentWithAuthority(
  userId: User['id'],
  environmentId: Environment['id'],
  authority: Authority,
  prisma: PrismaClient
): Promise<Environment> {
  // Fetch the environment
  let environment: Environment & { project: Project }

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

  return environment
}
