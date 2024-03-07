import { Authority, PrismaClient, User, Variable } from '@prisma/client'
import getCollectiveProjectAuthorities from './get-collective-project-authorities'
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
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

  // If the variable is pending creation, only the user who created the variable, a workspace admin or
  // a user with the MANAGE_APPROVALS authority can fetch the variable
  if (
    variable.pendingCreation &&
    !permittedAuthorities.has(Authority.WORKSPACE_ADMIN) &&
    !permittedAuthorities.has(Authority.MANAGE_APPROVALS) &&
    variable.lastUpdatedById !== userId
  ) {
    throw new BadRequestException(
      `The variable with id ${variableId} is pending creation and cannot be fetched by the user with id ${userId}`
    )
  }

  return variable
}
