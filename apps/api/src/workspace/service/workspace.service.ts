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
import {
  Authority,
  User,
  Workspace,
  WorkspaceMember,
  WorkspaceRole
} from '@prisma/client'
import {
  CreateWorkspace,
  WorkspaceMemberDTO
} from '../dto/create.workspace/create.workspace'
import {
  IMailService,
  MAIL_SERVICE
} from '../../mail/services/interface.service'
import { JwtService } from '@nestjs/jwt'
import { UpdateWorkspace } from '../dto/update.workspace/update.workspace'
import getWorkspaceWithAuthority from '../../common/get-workspace-with-authority'
import { v4 } from 'uuid'

@Injectable()
export class WorkspaceService {
  private readonly log = new Logger(WorkspaceService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService
  ) {}

  async createWorkspace(user: User, dto: CreateWorkspace) {
    if (await this.existsByName(dto.name, user.id)) {
      throw new ConflictException('Workspace already exists')
    }

    const workspaceId = v4()

    const createNewWorkspace = this.prisma.workspace.create({
      data: {
        id: workspaceId,
        name: dto.name,
        description: dto.description,
        isFreeTier: true,
        ownerId: user.id,
        roles: {
          createMany: {
            data: [
              {
                name: 'Admin',
                authorities: [Authority.WORKSPACE_ADMIN],
                hasAdminAuthority: true,
                colorCode: '#FF0000'
              }
            ]
          }
        }
      }
    })

    // Add the owner to the workspace
    const assignOwnership = this.prisma.workspaceMember.create({
      data: {
        workspace: {
          connect: {
            id: workspaceId
          }
        },
        user: {
          connect: {
            id: user.id
          }
        },
        invitationAccepted: true,
        roles: {
          create: {
            role: {
              connect: {
                workspaceId_name: {
                  workspaceId: workspaceId,
                  name: 'Admin'
                }
              }
            }
          }
        }
      }
    })

    const result = await this.prisma.$transaction([
      createNewWorkspace,
      assignOwnership
    ])

    this.log.debug(`Created workspace ${dto.name} (${workspaceId})`)

    return result[0]
  }

  async updateWorkspace(
    user: User,
    workspaceId: Workspace['id'],
    dto: UpdateWorkspace
  ) {
    // Fetch the workspace
    const workspace = await getWorkspaceWithAuthority(
      user.id,
      workspaceId,
      Authority.UPDATE_WORKSPACE,
      this.prisma
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
        description: dto.description,
        lastUpdatedBy: {
          connect: {
            id: user.id
          }
        }
      }
    })
  }

  async transferOwnership(
    user: User,
    workspaceId: Workspace['id'],
    userId: User['id']
  ): Promise<void> {
    const workspace = await getWorkspaceWithAuthority(
      user.id,
      workspaceId,
      Authority.TRANSFER_OWNERSHIP,
      this.prisma
    )

    if (userId === user.id) {
      throw new BadRequestException(
        `You are already the owner of the workspace ${workspace.name} (${workspace.id})`
      )
    }

    const workspaceMembership = await this.getWorkspaceMembership(
      workspaceId,
      userId
    )

    // Check if the user is a member of the workspace
    if (!workspaceMembership) {
      throw new NotFoundException(
        `User ${userId} is not a member of workspace ${workspace.name} (${workspace.id})`
      )
    }

    // Get the admin ownership role
    const adminOwnershipRole = await this.prisma.workspaceRole.findFirst({
      where: {
        workspaceId,
        hasAdminAuthority: true
      }
    })

    // Assign this role to the new owner
    const assignRole = this.prisma.workspaceMemberRoleAssociation.upsert({
      where: {
        roleId_workspaceMemberId: {
          roleId: adminOwnershipRole.id,
          workspaceMemberId: workspaceMembership.id
        }
      },
      create: {
        role: {
          connect: {
            workspaceId_name: {
              name: adminOwnershipRole.name,
              workspaceId
            }
          }
        },
        workspaceMember: {
          connect: {
            id: workspaceMembership.id
          }
        }
      },
      update: {}
    })

    // Update the owner of the workspace
    const updateUser = this.prisma.workspace.update({
      where: {
        id: workspaceId
      },
      data: {
        ownerId: userId,
        lastUpdatedBy: {
          connect: {
            id: user.id
          }
        }
      }
    })

    await this.prisma.$transaction([assignRole, updateUser])

    this.log.debug(
      `Transferred ownership of workspace ${workspace.name} (${workspace.id}) to user ${userId}`
    )
  }

  async deleteWorkspace(
    user: User,
    workspaceId: Workspace['id']
  ): Promise<void> {
    const workspace = await getWorkspaceWithAuthority(
      user.id,
      workspaceId,
      Authority.DELETE_WORKSPACE,
      this.prisma
    )

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
    const workspace = await getWorkspaceWithAuthority(
      user.id,
      workspaceId,
      Authority.ADD_USER,
      this.prisma
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
    const workspace = await getWorkspaceWithAuthority(
      user.id,
      workspaceId,
      Authority.REMOVE_USER,
      this.prisma
    )

    // Check if the user is already a member of the workspace
    if (!(await this.memberExistsInWorkspace(workspaceId, user.id)))
      throw new ConflictException(
        `User ${user.name} (${user.id}) is not a member of workspace ${workspace.name} (${workspace.id})`
      )

    // Remove users from the workspace if any
    const ops = []
    if (userIds && userIds.length > 0) {
      for (const userId of userIds) {
        if (userId === user.id)
          throw new ConflictException(
            `You cannot remove yourself from the workspace. Please delete the workspace instead.`
          )

        // Delete the membership
        ops.push(
          this.prisma.workspaceMember.delete({
            where: {
              workspaceId_userId: {
                workspaceId,
                userId
              }
            }
          })
        )
      }
    }

    await this.prisma.$transaction(ops)
  }

  async updateMemberRoles(
    user: User,
    workspaceId: Workspace['id'],
    userId: User['id'],
    roleIds: WorkspaceRole['id'][]
  ): Promise<void> {
    const workspace = await getWorkspaceWithAuthority(
      user.id,
      workspaceId,
      Authority.UPDATE_USER_ROLE,
      this.prisma
    )

    // Check if the member in concern is a part of the workspace or not
    if (!(await this.memberExistsInWorkspace(workspaceId, userId)))
      throw new NotFoundException(
        `User ${userId} is not a member of workspace ${workspace.name} (${workspace.id})`
      )

    // Update the role of the user
    await this.prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId
        }
      },
      data: {
        roles: {
          set: roleIds.map((id) => ({ id }))
        }
      }
    })

    this.log.debug(
      `Updated role of user ${userId} in workspace ${workspace.name} (${workspace.id})`
    )
  }

  async getAllMembersOfWorkspace(
    user: User,
    workspaceId: Workspace['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    await getWorkspaceWithAuthority(
      user.id,
      workspaceId,
      Authority.READ_USERS,
      this.prisma
    )

    return await this.prisma.workspaceMember.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        workspace: {
          [sort]: order
        }
      },
      where: {
        workspaceId,
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
      select: {
        id: true,
        user: true,
        roles: {
          select: {
            id: true,
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                colorCode: true,
                authorities: true,
                projects: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        }
      }
    })
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
    await this.prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id
        }
      },
      data: {
        invitationAccepted: true
      }
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
    await getWorkspaceWithAuthority(
      user.id,
      workspaceId,
      Authority.REMOVE_USER,
      this.prisma
    )

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
    await getWorkspaceWithAuthority(
      user.id,
      workspaceId,
      Authority.READ_USERS,
      this.prisma
    )

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
    await getWorkspaceWithAuthority(
      user.id,
      workspaceId,
      Authority.READ_USERS,
      this.prisma
    )

    return await this.memberExistsInWorkspace(workspaceId, otherUserId)
  }

  async getWorkspaceById(
    user: User,
    workspaceId: Workspace['id']
  ): Promise<Workspace> {
    return await getWorkspaceWithAuthority(
      user.id,
      workspaceId,
      Authority.READ_USERS,
      this.prisma
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
      const memberUser: User | null = await this.prisma.user.findUnique({
        where: {
          email: member.email
        }
      })

      // Check if the user is already a member of the workspace
      if (
        memberUser &&
        (await this.memberExistsInWorkspace(workspace.id, memberUser.id))
      )
        throw new ConflictException(
          `User ${memberUser.name} (${memberUser.id}) is already a member of workspace ${workspace.name} (${workspace.id})`
        )

      // Create the workspace membership
      const createMembership = this.prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: memberUser.id,
          roles: {
            connect: member.roleIds.map((r) => ({ id: r }))
          }
        }
      })

      let txResult

      if (memberUser) {
        txResult = await this.prisma.$transaction([createMembership])

        this.mailService.workspaceInvitationMailForUsers(
          member.email,
          workspace.name,
          `${process.env.WORKSPACE_FRONTEND_URL}/workspace/${workspace.id}/join`,
          currentUser.name,
          true
        )

        this.log.debug(
          `Sent workspace invitation mail to registered user ${memberUser}`
        )
      } else {
        const createMember = this.prisma.user.create({
          data: {
            email: member.email
          }
        })

        txResult = await this.prisma.$transaction([
          createMember,
          createMembership
        ])

        this.log.debug(`Created non-registered user ${memberUser}`)

        this.mailService.workspaceInvitationMailForUsers(
          member.email,
          workspace.name,
          `${process.env.WORKSPACE_FRONTEND_URL}/workspace/${
            workspace.id
          }/join?token=${await this.jwt.signAsync({
            id: memberUser.id
          })}`,
          currentUser.name,
          false
        )

        this.log.debug(
          `Sent workspace invitation mail to non-registered user ${memberUser}`
        )
      }

      this.log.debug(
        `Added user ${memberUser} to workspace ${workspace.name}. Membership: ${txResult[0].membership.id}`
      )
    }
  }

  private async memberExistsInWorkspace(
    workspaceId: string,
    userId: string
  ): Promise<boolean> {
    return (
      (await this.prisma.workspaceMember.count({
        where: {
          workspaceId,
          userId
        }
      })) > 0
    )
  }

  private async getWorkspaceMembership(
    workspaceId: Workspace['id'],
    userId: User['id']
  ): Promise<WorkspaceMember> {
    return await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId
        }
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
}
