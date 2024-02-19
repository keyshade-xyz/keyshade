import { Authority, PrismaClient, Secret, User } from '@prisma/client'
import { SecretWithProjectAndVersion } from '../secret/secret.types'
import getCollectiveProjectAuthorities from './get-collective-project-authorities'
import { NotFoundException, UnauthorizedException } from '@nestjs/common'

export default async function getSecretWithAuthority(
  userId: User['id'],
  secretId: Secret['id'],
  authority: Authority,
  prisma: PrismaClient
): Promise<SecretWithProjectAndVersion> {
  // Fetch the secret
  let secret: SecretWithProjectAndVersion

  try {
    secret = await prisma.secret.findUnique({
      where: {
        id: secretId
      },
      include: {
        versions: true,
        project: true,
        environment: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  } catch (error) {
    /* empty */
  }

  if (!secret) {
    throw new NotFoundException(`Secret with id ${secretId} not found`)
  }

  // Check if the user has the project in their workspace role list
  const permittedAuthorities = await getCollectiveProjectAuthorities(
    userId,
    secret.project,
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

  return secret
}
