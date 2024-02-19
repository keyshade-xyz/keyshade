import { Authority, PrismaClient, User, Variable } from '@prisma/client'
import getCollectiveProjectAuthorities from './get-collective-project-authorities'
import { NotFoundException, UnauthorizedException } from '@nestjs/common'
import { VariableWithProjectAndVersion } from '../variable/variable.types'

export default async function getVariableWithAuthority(
  userId: User['id'],
  variableId: Variable['id'],
  authority: Authority,
  prisma: PrismaClient
): Promise<VariableWithProjectAndVersion> {
  // Fetch the variable
  let variable: VariableWithProjectAndVersion

  try {
    variable = await prisma.variable.findUnique({
      where: {
        id: variableId
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

  if (!variable) {
    throw new NotFoundException(`Variable with id ${variableId} not found`)
  }

  // Check if the user has the project in their workspace role list
  const permittedAuthorities = await getCollectiveProjectAuthorities(
    userId,
    variable.project,
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

  return variable
}
