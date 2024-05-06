import { Authority, PrismaClient, Project, User } from '@prisma/client'

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
export default async function getCollectiveProjectAuthorities(
  userId: User['id'],
  project: Project,
  prisma: PrismaClient
): Promise<Set<Authority>> {
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
