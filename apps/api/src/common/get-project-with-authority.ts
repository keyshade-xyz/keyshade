import { NotFoundException } from '@nestjs/common'
import { Authority, PrismaClient, Project, User } from '@prisma/client'
import getCollectiveProjectAuthorities from './get-collective-project-authorities'
import { ProjectWithSecrets } from '../project/project.types'

export default async function getProjectWithAuthority(
  userId: User['id'],
  projectId: Project['id'],
  authority: Authority,
  prisma: PrismaClient
): Promise<ProjectWithSecrets> {
  // Fetch the project
  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    },
    include: {
      secrets: true
    }
  })

  if (!project) {
    throw new NotFoundException(`Project with id ${projectId} not found`)
  }

  const permittedAuthorities = await getCollectiveProjectAuthorities(
    userId,
    project,
    prisma
  )

  if (
    !permittedAuthorities.has(authority) &&
    !permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
  ) {
    throw new NotFoundException(
      `User with id ${userId} does not have the authority ${authority} in the project with id ${projectId}`
    )
  }

  return project
}
