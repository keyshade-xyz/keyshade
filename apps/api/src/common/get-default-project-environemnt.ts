import { Environment, PrismaClient, Project } from '@prisma/client'

export default async function getDefaultEnvironmentOfProject(
  projectId: Project['id'],
  prisma: PrismaClient
): Promise<Environment | null> {
  return await prisma.environment.findFirst({
    where: {
      projectId,
      isDefault: true
    }
  })
}
