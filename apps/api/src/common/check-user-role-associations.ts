import { Authority, PrismaClient, Project, User } from '@prisma/client'

/**
 * Given the userId and project, this function checks the set of roles associated
 * with the workspace member object of the user in the workspace of the
 * current project for associated projects where the project Id matches
 * with the current project's id and returns a boolean value.
 * @param userId The id of the user
 * @param project The project
 * @param authority The authority
 * @param prisma The prisma client
 * @returns
 */

export default async function checkUserRoleAssociations(
  userId: User['id'],
  project: Project,
  authority: Authority,
  prisma: PrismaClient
): Promise<boolean> {
  const workSpaceMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: project.workspaceId,
        userId
      }
    },
    select: {
      roles: {
        include: {
          role: {
            select: {
              authorities: true,
              projects: true
            }
          }
        }
      }
    }
  })
  // checking if the user is a member of the workspace
  if (!workSpaceMembership) {
    return false
  }
  const hasAccess = workSpaceMembership.roles.some(
    (role) =>
      role.role.authorities.includes(authority) &&
      role.role.projects.some((p) => p.id === project.id)
  )

  return hasAccess
}
