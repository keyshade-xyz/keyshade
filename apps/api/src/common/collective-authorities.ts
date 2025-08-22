import { RawEnvironment } from '@/environment/environment.types'
import { Logger } from '@nestjs/common'
import {
  Authority,
  PrismaClient,
  Project,
  User,
  Workspace
} from '@prisma/client'
import { WorkspaceCacheService } from '@/cache/workspace-cache.service'

/**
 * Given the userId and workspaceId, this function returns the set of authorities
 * that are formed by accumulating a set of all the authorities across all the
 * roles that the user has in the workspace.
 * @param workspaceId The id of the workspace
 * @param userId The id of the user
 * @param prisma The prisma client
 * @param workspaceCacheService The workspace cache service
 * @returns The set of authorities that the user has in the workspace
 */
export const getCollectiveWorkspaceAuthorities = async (
  workspaceId: Workspace['id'],
  userId: User['id'],
  prisma: PrismaClient,
  workspaceCacheService: WorkspaceCacheService
): Promise<Set<Authority>> => {
  const cachedWorkspaceCollectiveAuthorities =
    await workspaceCacheService.getCollectiveWorkspaceAuthorities(
      workspaceId,
      userId
    )

  if (cachedWorkspaceCollectiveAuthorities.size > 0) {
    return cachedWorkspaceCollectiveAuthorities
  }

  const collectiveWorkspaceAuthorities = new Set<Authority>()

  const isUserAdmin = await checkUserHasAdminRoleAssociation(
    userId,
    workspaceId,
    prisma,
    workspaceCacheService
  )

  if (isUserAdmin) {
    collectiveWorkspaceAuthorities.add('WORKSPACE_ADMIN')
  } else {
    const roleAssociations =
      await prisma.workspaceMemberRoleAssociation.findMany({
        where: {
          workspaceMember: {
            userId,
            workspaceId
          }
        },
        include: {
          role: true
        }
      })

    roleAssociations.forEach((roleAssociation) => {
      roleAssociation.role.authorities.forEach((authority) => {
        collectiveWorkspaceAuthorities.add(authority)
      })
    })
  }

  await workspaceCacheService.setCollectiveWorkspaceAuthorities(
    userId,
    workspaceId,
    collectiveWorkspaceAuthorities
  )

  return collectiveWorkspaceAuthorities
}

/**
 * Given the userId and project, this function returns the set of authorities
 * that are formed by accumulating a set of all the authorities across all the
 * roles that the user has in the workspace, adding an extra layer of filtering
 * by the project.
 * @param userId The id of the user
 * @param project The project
 * @param prisma The prisma client
 * @param workspaceCacheService
 * @returns
 */
export const getCollectiveProjectAuthorities = async (
  userId: User['id'],
  project: Partial<Project>,
  prisma: PrismaClient,
  workspaceCacheService: WorkspaceCacheService
): Promise<Set<Authority>> => {
  const isUserAdmin = await checkUserHasAdminRoleAssociation(
    userId,
    project.workspaceId,
    prisma,
    workspaceCacheService
  )
  if (isUserAdmin) return new Set(['WORKSPACE_ADMIN'])

  const authorities = new Set<Authority>()

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

  roleAssociations.forEach((roleAssociation) => {
    roleAssociation.role.authorities.forEach((authority) => {
      authorities.add(authority)
    })
  })

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
 * @param workspaceCacheService
 * @returns
 */
export const getCollectiveEnvironmentAuthorities = async (
  userId: User['id'],
  environment: RawEnvironment,
  prisma: PrismaClient,
  workspaceCacheService: WorkspaceCacheService
): Promise<Set<Authority>> => {
  const isUserAdmin = await checkUserHasAdminRoleAssociation(
    userId,
    environment.project.workspaceId,
    prisma,
    workspaceCacheService
  )
  if (isUserAdmin) return new Set(['WORKSPACE_ADMIN'])

  const authorities = new Set<Authority>()

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

  roleAssociations.forEach((roleAssociation) => {
    roleAssociation.role.authorities.forEach((authority) => {
      authorities.add(authority)
    })
  })

  return authorities
}

const checkUserHasAdminRoleAssociation = async (
  userId: User['id'],
  workspaceId: Workspace['id'],
  prisma: PrismaClient,
  workspaceCacheService: WorkspaceCacheService
): Promise<boolean> => {
  const cachedWorkspaceAdminUserId =
    await workspaceCacheService.getWorkspaceAdmin(workspaceId)

  if (cachedWorkspaceAdminUserId === userId) {
    return true
  }

  const logger = new Logger('checkUserHasAdminRoleAssociation')
  logger.log(
    `Checking if user ${userId} is associated to the admin role of workspace ${workspaceId}`
  )

  // Fetch the admin role for the workspace
  const adminRole = await prisma.workspaceRole.findFirst({
    where: {
      workspaceId: workspaceId,
      hasAdminAuthority: true
    },
    include: {
      workspaceMembers: {
        include: {
          workspaceMember: {
            select: {
              userId: true
            }
          }
        }
      }
    }
  })

  // Check if the user has associations to this role
  for (const roleAssociation of adminRole.workspaceMembers) {
    if (roleAssociation.workspaceMember.userId === userId) {
      logger.log(`User ${userId} is associated to the admin role`)
      await workspaceCacheService.setWorkspaceAdmin(workspaceId, userId)
      return true
    }
  }

  logger.log(`User ${userId} is not associated to the admin role`)
  return false
}
