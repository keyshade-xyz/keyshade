import { PrismaClient, Project, User } from '@prisma/client'

/**
 * Given the userId and project, this function checks the set of roles associated
 * with the userId of the user, for associated projects where the project Id matches
 * with the passed in project and returns a boolean value.
 * @param userId The id of the user
 * @param project The project
 * @param prisma The prisma client
 * @returns
 */

export default async function checkUserRoleAssociations(
  userId: User['id'],
  project: Project,
  prisma: PrismaClient
): Promise<Boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      workspaceMembers: {
        include: {
          roles: {
            include: {
              role: {
                include: {
                  projects: {
                    where: {
                      projectId: project.id
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  if (!user) {
    return false
  }

  const userHasProjectAccess = user.workspaceMembers.some((workspaceMember) =>
    workspaceMember.roles.some(
      (association) => association.role.projects.length > 0
    )
  )

  return userHasProjectAccess
}
