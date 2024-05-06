import { PrismaClient } from '@prisma/client'

export default async function cleanUp(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.workspaceMemberRoleAssociation.deleteMany(),
    prisma.workspaceMember.deleteMany(),
    prisma.workspaceRole.deleteMany(),
    prisma.workspace.deleteMany(),
    prisma.secret.deleteMany(),
    prisma.environment.deleteMany(),
    prisma.project.deleteMany(),
    prisma.user.deleteMany(),
    prisma.event.deleteMany(),
    prisma.apiKey.deleteMany(),
    prisma.variable.deleteMany(),
    prisma.integration.deleteMany()
  ])
}
