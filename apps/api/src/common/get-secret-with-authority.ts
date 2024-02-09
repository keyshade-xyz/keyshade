import { Authority, PrismaClient, Secret, User } from '@prisma/client'
import { SecretWithProjectAndVersion } from '../secret/secret.types'
import getCollectiveProjectAuthorities from './get-collective-project-authorities'
import { ConflictException, NotFoundException } from '@nestjs/common'

export default async function getSecretWithAuthority(
  userId: User['id'],
  secretId: Secret['id'],
  authority: Authority,
  prisma: PrismaClient
): Promise<SecretWithProjectAndVersion> {
  // Fetch the secret
  const secret = await prisma.secret.findUnique({
    where: {
      id: secretId
    },
    include: {
      versions: true,
      project: {
        include: {
          workspace: {
            include: {
              members: true
            }
          }
        }
      }
    }
  })

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
    throw new ConflictException(
      `User ${userId} does not have the required authorities`
    )
  }

  // Remove the workspace from the secret
  secret.project.workspace = undefined

  return secret
}
