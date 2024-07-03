import { PrismaService } from 'src/prisma/prisma.service'
import { AuthorityCheckerService } from './authority-checker.service'
import { Authority, Project, User } from '@prisma/client'

export default async function getEnvironmentsOfProject(
  prisma: PrismaService,
  authorityCheckerService: AuthorityCheckerService,
  user: User,
  projectId: Project['id'],
  sort: string,
  order: string,
  search: string
) {
  // Check authority
  await authorityCheckerService.checkAuthorityOverProject({
    userId: user.id,
    entity: { id: projectId },
    authority: Authority.READ_ENVIRONMENT,
    prisma
  })

  // Get the environments
  return await prisma.environment.findMany({
    where: {
      projectId,
      name: {
        contains: search
      }
    },
    include: {
      lastUpdatedBy: true
    },
    orderBy: {
      [sort]: order
    }
  })
}
