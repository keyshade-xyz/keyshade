import { HydratedEnvironment } from '@/environment/environment.types'
import { Logger } from '@nestjs/common'
import {
  Authority,
  PrismaClient,
  Project,
  User,
  Workspace
} from '@prisma/client'

/**
 * Given the userId and workspaceId, this function returns the set of authorities
 * that are formed by accumulating a set of all the authorities across all the
 * roles that the user has in the workspace.
 * @param workspaceId The id of the workspace
 * @param userId The id of the user
 * @param prisma The prisma client
 */
export const getCollectiveWorkspaceAuthorities = async (
  workspaceId: Workspace['id'],
  userId: User['id'],
  prisma: PrismaClient
): Promise<Set<Authority>> => {
  const logger = new Logger('getCollectiveWorkspaceAuthorities')
  logger.log(
    `Getting collective workspace authorities for workspaceId: ${workspaceId} and userId: ${userId}`
  )
  const authorities = new Set<Authority>()

  logger.log(
    `Fetching workspaceMemberRoleAssociation for workspaceId: ${workspaceId} and userId: ${userId}`
  )
  const roleAssociations = await prisma.workspaceMemberRoleAssociation.findMany(
    {
      where: {
        workspaceMember: {
          userId,
          workspaceId
        }
      },
      include: {
        role: true
      }
    }
  )
  logger.log(`Found ${roleAssociations.length} workspaceMemberRoleAssociations`)

  roleAssociations.forEach((roleAssociation) => {
    roleAssociation.role.authorities.forEach((authority) => {
      authorities.add(authority)
    })
  })

  logger.log(
    `Found ${authorities.size} authorities: ${Array.from(authorities)}`
  )
  return authorities
}

/**
 * Given the userId and project, this function returns the set of authorities
 * that are formed by accumulating a set of all the authorities across all the
 * roles that the user has in the workspace, adding an extra layer of filtering
 * by the project.
 * @param userId The id of the user
 * @param project The project
 * @param prisma The prisma client
 * @returns
 */
export const getCollectiveProjectAuthorities = async (
  userId: User['id'],
  project: Partial<Project>,
  prisma: PrismaClient
): Promise<Set<Authority>> => {
  const logger = new Logger('getCollectiveProjectAuthorities')

  logger.log(
    `Getting collective project authorities for userId: ${userId} and projectId: ${project.id}`
  )
  const authorities = new Set<Authority>()

  logger.log(
    `Fetching workspaceMemberRoleAssociation for userId: ${userId} and projectId: ${project.id}`
  )
  const roleAssociations = await prisma.workspaceMemberRoleAssociation.findMany(
    {
      where: {
        workspaceMember: {
          userId,
          workspaceId: project.workspaceId
        },
        role: {
          projects: {
            some: {
              projectId: project.id
            }
          }
        }
      },
      select: {
        role: {
          select: {
            authorities: true
          }
        }
      }
    }
  )

  logger.log(
    `Found ${roleAssociations.length} workspaceMemberRoleAssociations for userId: ${userId} and projectId: ${project.id}`
  )
  roleAssociations.forEach((roleAssociation) => {
    roleAssociation.role.authorities.forEach((authority) => {
      authorities.add(authority)
    })
  })

  logger.log(
    `Found ${authorities.size} authorities for userId: ${userId} and projectId: ${project.id}`
  )
  return authorities
}

/**
 * Given the userId and environment, this function returns the set of authorities
 * that are formed by accumulating a set of all the authorities across all the
 * roles that the user has in the workspace, adding an extra layer of filtering
 * by the project and the environment.
 * @param userId The id of the user
 * @param environment The environment with the project
 * @param prisma The prisma client
 * @returns
 */
export const getCollectiveEnvironmentAuthorities = async (
  userId: User['id'],
  environment: Omit<HydratedEnvironment, 'entitlements'>,
  prisma: PrismaClient
): Promise<Set<Authority>> => {
  const logger = new Logger('getCollectiveEnvironmentAuthorities')

  logger.log(
    `Getting collective environment authorities for userId: ${userId} and environmentId: ${environment.id}`
  )
  const authorities = new Set<Authority>()

  logger.log(
    `Fetching workspaceMemberRoleAssociation for userId: ${userId} and environmentId: ${environment.id}`
  )
  const roleAssociations = await prisma.workspaceMemberRoleAssociation.findMany(
    {
      where: {
        workspaceMember: {
          userId,
          workspaceId: environment.project.workspaceId
        },
        role: {
          OR: [
            {
              projects: {
                some: {
                  projectId: environment.project.id,
                  environments: {
                    some: {
                      id: environment.id
                    }
                  }
                }
              }
            },
            // Check if the user has the WORKSPACE_ADMIN authority
            {
              authorities: {
                has: Authority.WORKSPACE_ADMIN
              }
            }
          ]
        }
      },
      select: {
        role: {
          select: {
            authorities: true
          }
        }
      }
    }
  )

  logger.log(
    `Found ${roleAssociations.length} workspaceMemberRoleAssociations for userId: ${userId} and environmentId: ${environment.id}`
  )
  roleAssociations.forEach((roleAssociation) => {
    roleAssociation.role.authorities.forEach((authority) => {
      authorities.add(authority)
    })
  })

  logger.log(
    `Found ${authorities.size} authorities for userId: ${userId} and environmentId: ${environment.id}`
  )
  return authorities
}
