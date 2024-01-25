import { Injectable, UnauthorizedException } from '@nestjs/common'
import { Workspace, WorkspaceRole, User } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class WorkspacePermission {
  constructor(private readonly prisma: PrismaService) {}

  async isWorkspaceAdmin(
    user: User,
    workspaceId: Workspace['id']
  ): Promise<void> {
    // Admins can do everything
    if (user.isAdmin) Promise.resolve()

    // Else, check if the user is a workspace admin
    const membership = await this.getMembership(workspaceId, user.id)

    if (membership.role !== WorkspaceRole.OWNER) {
      throw new UnauthorizedException('Atleast OWNER role is required')
    }
  }

  async isWorkspaceMaintainer(
    user: User,
    workspaceId: Workspace['id']
  ): Promise<void> {
    // Admins can do everything
    if (user.isAdmin) Promise.resolve()

    // Else, check if the user is a workspace admin
    // const memberships = await this.resolveWorkspacesOfUser(user)
    const membership = await this.getMembership(workspaceId, user.id)

    if (
      membership.role !== WorkspaceRole.OWNER &&
      membership.role !== WorkspaceRole.MAINTAINER
    ) {
      throw new UnauthorizedException('Atleast MAINTAINER role is required')
    }
  }

  async isWorkspaceMember(
    user: User,
    workspaceId: Workspace['id']
  ): Promise<void> {
    // Admins can do everything
    if (user.isAdmin) Promise.resolve()

    // Else, check if the user is a workspace admin
    this.getMembership(workspaceId, user.id)
  }

  private async getMembership(
    workspaceId: Workspace['id'],
    userId: User['id']
  ) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId
        }
      }
    })

    if (!membership) {
      throw new UnauthorizedException('User is not a member of the workspace')
    }

    return membership
  }

  // private async resolveWorkspacesOfUser(
  //   user: User
  // ): Promise<{ workspaceId: Workspace['id']; role: WorkspaceRole }[]> {
  //   // const memberships = await this.repository.getWorkspaceMembershipsOfUser(
  //   //   user.id
  //   // )
  //   const memberships = await this.prisma.workspaceMember.findMany({
  //     where: {
  //       userId: user.id
  //     }
  //   })
  //   return memberships.map((membership) => ({
  //     workspaceId: membership.workspaceId,
  //     role: membership.role
  //   }))
  // }
}
