import { EnvironmentWithProject } from '@/environment/environment.types'
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
  const authorities = new Set<Authority>()

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
  roleAssociations.forEach((roleAssociation) => {
    roleAssociation.role.authorities.forEach((authority) => {
      authorities.add(authority)
    })
  })

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
  project: Project,
  prisma: PrismaClient
): Promise<Set<Authority>> => {
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
 * @returns
 */
export const getCollectiveEnvironmentAuthorities = async (
  userId: User['id'],
  environment: EnvironmentWithProject,
  prisma: PrismaClient
): Promise<Set<Authority>> => {
  const authorities = new Set<Authority>()

  const projectRoleAssociations =
    await prisma.workspaceMemberRoleAssociation.findMany({
      where: {
        workspaceMember: {
          userId,
          workspaceId: environment.project.workspaceId
        },
        role: {
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
        }
      },
      select: {
        role: {
          select: {
            authorities: true
          }
        }
      }
    })

  projectRoleAssociations.forEach((roleAssociation) => {
    roleAssociation.role.authorities.forEach((authority) => {
      authorities.add(authority)
    })
  })

  return authorities
}
