import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { User, Workspace, WorkspaceMember, WorkspaceRole } from '@prisma/client'
import {
  CreateWorkspace,
  WorkspaceMemberDTO
} from '../dto/create.workspace/create.workspace'
import { WorkspacePermission } from '../misc/workspace.permission'
import { ApiKeyWorkspaceRoles } from '../../common/api-key-roles'
import {
  IMailService,
  MAIL_SERVICE
} from '../../mail/services/interface.service'
import { JwtService } from '@nestjs/jwt'
import { UpdateWorkspace } from '../dto/update.workspace/update.workspace'
import permittedRoles from '../../common/get-permitted.roles'

@Injectable()
export class WorkspaceService {
  private readonly log = new Logger(WorkspaceService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly permission: WorkspacePermission,
    private readonly jwt: JwtService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService
  ) {}

  async createWorkspace(user: User, dto: CreateWorkspace) {
    if (await this.existsByName(dto.name, user.id)) {
      throw new ConflictException('Workspace already exists')
    }

    const newWorkspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        description: dto.description,
        isDefault: false,
        isFreeTier: true,
        ownerId: user.id,
        members: {
          create: {
            user: {
              connect: {
                id: user.id
              }
            },
            role: WorkspaceRole.OWNER,
            invitationAccepted: true
          }
        }
      }
    })

    // Add users to the project if any
    if (dto.members && dto.members.length > 0) {
      this.addMembersToWorkspace(newWorkspace, user, dto.members)
    }

    this.log.debug(
      `Created workspace ${newWorkspace.name} (${newWorkspace.id})`
    )

    return newWorkspace
  }

  async updateWorkspace(
    user: User,
    workspaceId: Workspace['id'],
    dto: UpdateWorkspace
  ) {
    // Fetch the workspace
    const workspace = await this.getWorkspaceWithRole(
      user.id,
      workspaceId,
      WorkspaceRole.OWNER
    )

    // Check if a same named workspace already exists
    if (
      (dto.name && (await this.existsByName(dto.name, user.id))) ||
      dto.name === workspace.name
    ) {
      throw new ConflictException('Workspace already exists')
    }

    // Update the workspace
    return await this.prisma.workspace.update({
      where: {
        id: workspaceId
      },
      data: {
        name: dto.name,
        description: dto.description
      }
    })
  }

  async transferOwnership(
    user: User,
    workspaceId: Workspace['id'],
    userId: User['id']
  ): Promise<void> {
    const workspace = await this.getWorkspaceWithRole(
      user.id,
      workspaceId,
      WorkspaceRole.OWNER
    )

    // Check if the user is a member of the workspace
    if (!(await this.memberExistsInWorkspace(workspaceId, userId)))
      throw new NotFoundException(
        `User ${userId} is not a member of workspace ${workspace.name} (${workspace.id})`
      )

    // Update the role of the user
    await this.updateMembership(workspaceId, userId, {
      role: WorkspaceRole.OWNER
    })

    // Update the owner of the workspace
    await this.prisma.workspace.update({
      where: {
        id: workspaceId
      },
      data: {
        ownerId: userId
      }
    })

    this.log.debug(
      `Transferred ownership of workspace ${workspace.name} (${workspace.id}) to user ${userId}`
    )
  }

  async deleteWorkspace(
    user: User,
    workspaceId: Workspace['id']
  ): Promise<void> {
    const workspace = await this.getWorkspaceWithRole(
      user.id,
      workspaceId,
      WorkspaceRole.OWNER
    )

    // Delete the API key scopes associated with this workspace
    await this.deleteApiKeyScopesOfWorkspace(workspaceId)

    // Delete the workspace
    await this.prisma.workspace.delete({
      where: {
        id: workspaceId
      }
    })

    this.log.debug(`Deleted workspace ${workspace.name} (${workspace.id})`)
  }

  async addUsersToWorkspace(
    user: User,
    workspaceId: Workspace['id'],
    members: WorkspaceMemberDTO[]
  ): Promise<void> {
    const workspace = await this.getWorkspaceWithRole(
      user.id,
      workspaceId,
      WorkspaceRole.OWNER
    )

    // Add users to the workspace if any
    if (members && members.length > 0) {
      this.addMembersToWorkspace(workspace, user, members)
    }
  }

  async removeUsersFromWorkspace(
    user: User,
    workspaceId: Workspace['id'],
    userIds: User['id'][]
  ): Promise<void> {
    const workspace = await this.getWorkspaceWithRole(
      user.id,
      workspaceId,
      WorkspaceRole.OWNER
    )

    // Check if the user is already a member of the workspace
    if (!(await this.memberExistsInWorkspace(workspaceId, user.id)))
      throw new ConflictException(
        `User ${user.name} (${user.id}) is not a member of workspace ${workspace.name} (${workspace.id})`
      )

    // Remove users from the workspace if any
    if (userIds && userIds.length > 0) {
      for (const userId of userIds) {
        if (userId === user.id)
          throw new ConflictException(
            `You cannot remove yourself from the workspace. Please delete the workspace instead.`
          )

        // Delete the membership
        await this.prisma.workspaceMember.delete({
          where: {
            workspaceId_userId: {
              workspaceId,
              userId
            }
          }
        })

        // Delete the API key scopes associated with this workspace
        await this.deleteApiKeyScopesOfWorkspace(workspaceId, userId)

        this.log.debug(
          `Removed user ${userId} from workspace ${workspace.name} (${workspace.id})`
        )
      }
    }
  }

  async updateMemberRole(
    user: User,
    workspaceId: Workspace['id'],
    userId: User['id'],
    role: WorkspaceRole
  ): Promise<void> {
    const workspace = await this.getWorkspaceWithRole(
      user.id,
      workspaceId,
      WorkspaceRole.OWNER
    )

    // Check if the member in concern is a part of the workspace or not
    if (!(await this.memberExistsInWorkspace(workspaceId, userId)))
      throw new NotFoundException(
        `User ${userId} is not a member of workspace ${workspace.name} (${workspace.id})`
      )

    // Check if the user has the permission to update the role of the user
    this.permission.isWorkspaceAdmin(user, workspaceId)

    // Fetch the current role of the user in concern
    const currentRole = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId
        }
      },
      select: {
        role: true
      }
    })

    // We only want to reduce the roles of the API key if the user's role has been downgraded
    if (
      (currentRole.role === WorkspaceRole.OWNER &&
        role !== WorkspaceRole.OWNER) ||
      (currentRole.role === WorkspaceRole.MAINTAINER &&
        role == WorkspaceRole.VIEWER)
    ) {
      const previousAPIKeyScopes =
        await this.prisma.apiKeyWorkspaceScope.findFirst({
          where: {
            workspaceId,
            apiKey: {
              userId
            }
          },
          select: {
            roles: true
          }
        })

      // Filtering out the old roles that are now not allowed
      const updatedRoles = previousAPIKeyScopes.roles.filter((scope) =>
        ApiKeyWorkspaceRoles[currentRole.role].includes(scope)
      )

      // Update the API key scopes associated with this workspace
      await this.prisma.apiKeyWorkspaceScope.updateMany({
        where: {
          workspaceId,
          apiKey: {
            userId
          }
        },
        data: {
          roles: updatedRoles
        }
      })
    }

    // Update the role of the user
    await this.updateMembership(workspaceId, userId, {
      role
    })

    this.log.debug(
      `Updated role of user ${userId} to ${role} in workspace ${workspace.name} (${workspace.id})`
    )
  }

  async acceptInvitation(
    user: User,
    workspaceId: Workspace['id']
  ): Promise<void> {
    // Check if the user has a pending invitation to the workspace
    if (!(await this.invitationPending(workspaceId, user.id)))
      throw new ConflictException(
        `User ${user.name} (${user.id}) is not invited to workspace ${workspaceId}`
      )

    // Update the membership
    await this.updateMembership(workspaceId, user.id, {
      invitationAccepted: true
    })

    this.log.debug(
      `User ${user.name} (${user.id}) accepted invitation to workspace ${workspaceId}`
    )
  }

  async cancelInvitation(
    user: User,
    workspaceId: Workspace['id'],
    inviteeId: User['id']
  ): Promise<void> {
    // Check if the user has permission to decline the invitation
    this.permission.isWorkspaceAdmin(user, workspaceId)

    // Check if the user has a pending invitation to the workspace
    if (!(await this.invitationPending(workspaceId, inviteeId)))
      throw new ConflictException(
        `User ${user.id} is not invited to workspace ${workspaceId}`
      )

    // Delete the membership
    await this.deleteMembership(workspaceId, inviteeId)

    this.log.debug(
      `User ${user.name} (${user.id}) declined invitation to workspace ${workspaceId}`
    )
  }

  async declineInvitation(
    user: User,
    workspaceId: Workspace['id']
  ): Promise<void> {
    // Check if the user has a pending invitation to the workspace
    if (!(await this.invitationPending(workspaceId, user.id)))
      throw new ConflictException(
        `User ${user.name} (${user.id}) is not invited to workspace ${workspaceId}`
      )

    // Delete the membership
    await this.deleteMembership(workspaceId, user.id)

    this.log.debug(
      `User ${user.name} (${user.id}) declined invitation to workspace ${workspaceId}`
    )
  }

  async leaveWorkspace(
    user: User,
    workspaceId: Workspace['id']
  ): Promise<void> {
    // Get all the memberships of this workspace
    const memberships = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId
      }
    })

    if (memberships.length === 0) {
      // The workspace doesn't exist
      throw new NotFoundException(`Workspace with id ${workspaceId} not found`)
    }

    const workspaceOwnerId = await this.prisma.workspace
      .findUnique({
        where: {
          id: workspaceId
        },
        select: {
          ownerId: true
        }
      })
      .then((workspace) => workspace.ownerId)

    // Check if the user is the owner of the workspace
    if (workspaceOwnerId === user.id)
      throw new BadRequestException(
        `You cannot leave the workspace as you are the owner of the workspace. Please transfer the ownership to another member before leaving the workspace.`
      )

    // Check if the user is a member of the workspace
    if (
      memberships.find((membership) => membership.userId === user.id) === null
    )
      throw new UnauthorizedException(
        `User ${user.name} (${user.id}) is not a member of workspace ${workspaceId}`
      )

    if (memberships.length === 1) {
      // If the user is the last member of the workspace, delete the workspace
      await this.deleteWorkspace(user, workspaceId)
      return
    }

    // Delete the membership
    await this.deleteMembership(workspaceId, user.id)

    // Delete the API key scopes associated with this workspace
    await this.deleteApiKeyScopesOfWorkspace(workspaceId, user.id)

    this.log.debug(
      `User ${user.name} (${user.id}) left workspace ${workspaceId}`
    )
  }

  async getWorkspaceMembers(
    user: User,
    workspaceId: Workspace['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    await this.getWorkspaceWithRole(user.id, workspaceId, WorkspaceRole.VIEWER)

    return await this.prisma.workspaceMember.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        workspace: {
          [sort]: order
        }
      },
      where: {
        workspaceId: workspaceId,
        user: {
          OR: [
            {
              name: {
                contains: search
              }
            },
            {
              email: {
                contains: search
              }
            }
          ]
        }
      },
      include: {
        user: true
      }
    })
  }

  async isUserMemberOfWorkspace(
    user: User,
    workspaceId: Workspace['id'],
    otherUserId: User['id']
  ): Promise<boolean> {
    await this.getWorkspaceWithRole(user.id, workspaceId, WorkspaceRole.VIEWER)

    return await this.memberExistsInWorkspace(workspaceId, otherUserId)
  }

  async getWorkspaceById(
    user: User,
    workspaceId: Workspace['id']
  ): Promise<Workspace> {
    return await this.getWorkspaceWithRole(
      user.id,
      workspaceId,
      WorkspaceRole.VIEWER
    )
  }

  async getWorkspacesOfUser(
    user: User,
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    return await this.prisma.workspace.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort]: order
      },
      where: {
        members: {
          some: {
            userId: user.id
          }
        },
        OR: [
          {
            name: {
              contains: search
            }
          },
          {
            description: {
              contains: search
            }
          }
        ]
      }
    })
  }

  async getWorkspaces(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    return await this.prisma.workspace.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort]: order
      },
      where: {
        OR: [
          {
            name: {
              contains: search
            }
          },
          {
            description: {
              contains: search
            }
          }
        ]
      }
    })
  }

  private async existsByName(
    name: string,
    userId: User['id']
  ): Promise<boolean> {
    return (
      (await this.prisma.workspace.count({
        where: {
          name,
          ownerId: userId
        }
      })) > 0
    )
  }

  private async addMembersToWorkspace(
    workspace: Workspace,
    currentUser: User,
    members: WorkspaceMemberDTO[]
  ) {
    for (const member of members) {
      let memberUser: User | null = await this.prisma.user.findUnique({
        where: {
          email: member.email
        }
      })

      // Check if the user is already a member of the workspace
      if (
        memberUser &&
        (await this.memberExistsInWorkspace(workspace.id, memberUser.id))
      )
        continue

      if (memberUser) {
        this.mailService.workspaceInvitationMailForRegisteredUser(
          member.email,
          workspace.name,
          `${process.env.WORKSPACE_FRONTEND_URL}/workspace/${workspace.id}/join`,
          currentUser.name,
          member.role
        )

        this.log.debug(
          `Sent workspace invitation mail to registered user ${memberUser}`
        )
      } else {
        memberUser = await this.prisma.user.create({
          data: {
            email: member.email
          }
        })

        this.log.debug(`Created non-registered user ${memberUser}`)

        this.mailService.workspaceInvitationMailForNonRegisteredUser(
          member.email,
          workspace.name,
          `${process.env.WORKSPACE_FRONTEND_URL}/workspace/${
            workspace.id
          }/join?token=${await await this.jwt.signAsync({
            id: memberUser.id
          })}`,
          currentUser.name,
          member.role
        )

        this.log.debug(
          `Sent workspace invitation mail to non-registered user ${memberUser}`
        )
      }

      // Create the workspace membership
      const membership = await this.prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: memberUser.id,
          role: member.role
        }
      })

      this.log.debug(
        `Added user ${memberUser} as ${member.role} to workspace ${workspace.name}. Membership: ${membership.id}`
      )
    }
  }

  private async memberExistsInWorkspace(
    workspaceId: string,
    userId: string
  ): Promise<boolean> {
    return await this.prisma.workspaceMember
      .count({
        where: {
          workspaceId,
          userId
        }
      })
      .then((count) => count > 0)
  }

  private async updateMembership(
    workspaceId: Workspace['id'],
    userId: User['id'],
    data: Partial<Pick<WorkspaceMember, 'role' | 'invitationAccepted'>>
  ): Promise<WorkspaceMember> {
    return await this.prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId
        }
      },
      data: {
        role: data.role,
        invitationAccepted: data.invitationAccepted
      }
    })
  }

  private async deleteMembership(
    workspaceId: Workspace['id'],
    userId: User['id']
  ): Promise<void> {
    await this.prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId
        }
      }
    })
  }

  private async invitationPending(
    workspaceId: Workspace['id'],
    userId: User['id']
  ): Promise<boolean> {
    return await this.prisma.workspaceMember
      .count({
        where: {
          workspaceId,
          userId,
          invitationAccepted: false
        }
      })
      .then((count) => count > 0)
  }

  private async deleteApiKeyScopesOfWorkspace(
    workspaceId: Workspace['id'],
    userId?: User['id']
  ) {
    await this.prisma.apiKeyWorkspaceScope.deleteMany({
      where: {
        workspaceId,
        apiKey: {
          userId
        }
      }
    })
  }

  private async getWorkspaceWithRole(
    userId: User['id'],
    workspaceId: Workspace['id'],
    role: WorkspaceRole
  ): Promise<Workspace> {
    const workspace = await this.prisma.workspace.findUnique({
      where: {
        id: workspaceId
      },
      include: {
        members: true
      }
    })

    // Check if the workspace exists or not
    if (!workspace) {
      throw new NotFoundException(`Workspace with id ${workspaceId} not found`)
    }

    // Check if the user is a member of the workspace
    if (
      !workspace.members.some(
        (member) =>
          member.userId === userId && permittedRoles(role).includes(role)
      )
    ) {
      throw new UnauthorizedException(
        `User ${userId} is not a member of workspace ${workspaceId}`
      )
    }

    return workspace
  }
}
