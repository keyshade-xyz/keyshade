import { ConflictException, NotFoundException } from '@nestjs/common'
import { Authority, Environment, PrismaClient, User } from '@prisma/client'
import getCollectiveProjectAuthorities from './get-collective-project-authorities'

export default async function getEnvironmentWithAuthority(
  userId: User['id'],
  environmentId: Environment['id'],
  authority: Authority,
  prisma: PrismaClient
): Promise<Environment> {
  // Fetch the environment
  const environment = await prisma.environment.findUnique({
    where: {
      id: environmentId
    },
    include: {
      project: true
    }
  })

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
    throw new ConflictException(
      `User ${userId} does not have the required authorities`
    )
  }

  return environment
}
