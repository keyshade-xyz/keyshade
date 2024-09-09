import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import {
  Authority,
  Environment,
  EventSource,
  EventType,
  Project,
  ProjectAccessLevel,
  Secret,
  User,
  Variable,
  Workspace,
  WorkspaceMember,
  WorkspaceRole
} from '@prisma/client'
import {
  CreateWorkspace,
  WorkspaceMemberDTO
} from '../dto/create.workspace/create.workspace'
import { IMailService, MAIL_SERVICE } from '@/mail/services/interface.service'
import { JwtService } from '@nestjs/jwt'
import { UpdateWorkspace } from '../dto/update.workspace/update.workspace'
import { v4 } from 'uuid'
import { AuthorityCheckerService } from '@/common/authority-checker.service'
import { paginate } from '@/common/paginate'
import generateEntitySlug from '@/common/slug-generator'
import { getUserByEmail } from '@/common/user'
import { createWorkspace } from '@/common/workspace'
import { createEvent } from '@/common/event'
import { limitMaxItemsPerPage } from '@/common/util'
import { getCollectiveProjectAuthorities } from '@/common/collective-authorities'

@Injectable()
export class WorkspaceService {
  private readonly log = new Logger(WorkspaceService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService,
    private readonly authorityCheckerService: AuthorityCheckerService
  ) {}

  /**
   * Creates a new workspace for the given user.
   * @throws ConflictException if the workspace with the same name already exists
   * @param user The user to create the workspace for
   * @param dto The data to create the workspace with
   * @returns The created workspace
   */
  async createWorkspace(user: User, dto: CreateWorkspace) {
    if (await this.existsByName(dto.name, user.id)) {
      throw new ConflictException('Workspace already exists')
    }

    return await createWorkspace(user, dto, this.prisma)
  }

  /**
   * Updates a workspace
   * @throws ConflictException if the workspace with the same name already exists
   * @param user The user to update the workspace for
   * @param workspaceSlug The slug of the workspace to update
   * @param dto The data to update the workspace with
   * @returns The updated workspace
   */
  async updateWorkspace(
    user: User,
    workspaceSlug: Workspace['slug'],
    dto: UpdateWorkspace
  ) {
    // Fetch the workspace
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.UPDATE_WORKSPACE],

        prisma: this.prisma
      })

    // Check if a same named workspace already exists
    if (
      (dto.name && (await this.existsByName(dto.name, user.id))) ||
      dto.name === workspace.name
    ) {
      throw new ConflictException('Workspace already exists')
    }

    const updatedWorkspace = await this.prisma.workspace.update({
      where: {
        id: workspace.id
      },
      data: {
        name: dto.name,
        slug: dto.name
          ? await generateEntitySlug(dto.name, 'WORKSPACE', this.prisma)
          : undefined,
        description: dto.description,
        lastUpdatedBy: {
          connect: {
            id: user.id
          }
        }
      }
    })
    this.log.debug(`Updated workspace ${workspace.name} (${workspace.id})`)

    await createEvent(
      {
        triggeredBy: user,
        entity: workspace,
        type: EventType.WORKSPACE_UPDATED,
        source: EventSource.WORKSPACE,
        title: `Workspace updated`,
        metadata: {
          workspaceId: workspace.id,
          name: workspace.name
        },
        workspaceId: workspace.id
      },
      this.prisma
    )

    return updatedWorkspace
  }

  /**
   * Transfers ownership of a workspace to another user.
   * @param user The user transferring the ownership
   * @param workspaceSlug The slug of the workspace to transfer
   * @param otherUserEmail The email of the user to transfer the ownership to
   * @throws BadRequestException if the user is already the owner of the workspace,
   * or if the workspace is the default workspace
   * @throws NotFoundException if the other user is not a member of the workspace
   * @throws InternalServerErrorException if there is an error in the transaction
   */
  async transferOwnership(
    user: User,
    workspaceSlug: Workspace['slug'],
    otherUserEmail: User['email']
  ): Promise<void> {
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.WORKSPACE_ADMIN],

        prisma: this.prisma
      })

    const otherUser = await getUserByEmail(otherUserEmail, this.prisma)

    if (otherUser.id === user.id) {
      throw new BadRequestException(
        `You are already the owner of the workspace ${workspace.name} (${workspace.slug})`
      )
    }

    // We don't want the users to be able to transfer
    // ownership if the workspace is the default workspace
    if (workspace.isDefault) {
      throw new BadRequestException(
        `You cannot transfer ownership of default workspace ${workspace.name} (${workspace.slug})`
      )
    }

    const workspaceMembership = await this.getWorkspaceMembership(
      workspace.id,
      otherUser.id
    )

    // Check if the user is a member of the workspace
    if (!workspaceMembership) {
      throw new NotFoundException(
        `${otherUser.email} is not a member of workspace ${workspace.name} (${workspace.slug})`
      )
    }

    const currentUserMembership = await this.getWorkspaceMembership(
      workspace.id,
      user.id
    )

    // Get the admin ownership role
    const adminOwnershipRole = await this.prisma.workspaceRole.findFirst({
      where: {
        workspaceId: workspace.id,
        hasAdminAuthority: true
      }
    })

    // Remove this role from the current owner
    const removeRole = this.prisma.workspaceMemberRoleAssociation.delete({
      where: {
        roleId_workspaceMemberId: {
          roleId: adminOwnershipRole.id,
          workspaceMemberId: currentUserMembership.id
        }
      }
    })

    // Assign this role to the new owner
    const assignRole = this.prisma.workspaceMemberRoleAssociation.create({
      data: {
        role: {
          connect: {
            id: adminOwnershipRole.id
          }
        },
        workspaceMember: {
          connect: {
            id: workspaceMembership.id
          }
        }
      }
    })

    // Update the owner of the workspace
    const updateWorkspace = this.prisma.workspace.update({
      where: {
        id: workspace.id
      },
      data: {
        ownerId: otherUser.id,
        lastUpdatedBy: {
          connect: {
            id: user.id
          }
        }
      }
    })

    try {
      await this.prisma.$transaction([removeRole, assignRole, updateWorkspace])
    } catch (e) {
      this.log.error('Error in transaction', e)
      throw new InternalServerErrorException('Error in transaction')
    }

    await createEvent(
      {
        triggeredBy: user,
        entity: workspace,
        type: EventType.WORKSPACE_UPDATED,
        source: EventSource.WORKSPACE,
        title: `Workspace transferred`,
        metadata: {
          workspaceId: workspace.id,
          name: workspace.name,
          newOwnerId: otherUser.id
        },
        workspaceId: workspace.id
      },
      this.prisma
    )

    this.log.debug(
      `Transferred ownership of workspace ${workspace.name} (${workspace.id}) to user ${otherUser.email} (${otherUser.id})`
    )
  }

  /**
   * Deletes a workspace.
   * @throws BadRequestException if the workspace is the default workspace
   * @param user The user to delete the workspace for
   * @param workspaceSlug The slug of the workspace to delete
   */
  async deleteWorkspace(
    user: User,
    workspaceSlug: Workspace['slug']
  ): Promise<void> {
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.DELETE_WORKSPACE],
        prisma: this.prisma
      })

    // We don't want the users to delete their default workspace
    if (workspace.isDefault) {
      throw new BadRequestException(
        `You cannot delete the default workspace ${workspace.name} (${workspace.slug})`
      )
    }

    // Delete the workspace
    await this.prisma.workspace.delete({
      where: {
        id: workspace.id
      }
    })

    this.log.debug(`Deleted workspace ${workspace.name} (${workspace.slug})`)
  }

  /**
   * Invites users to a workspace.
   * @param user The user to invite the users for
   * @param workspaceSlug The slug of the workspace to invite users to
   * @param members The members to invite
   * @throws BadRequestException if the user does not have the authority to add users to the workspace
   * @throws NotFoundException if the workspace or any of the users to invite do not exist
   * @throws InternalServerErrorException if there is an error in the transaction
   */
  async inviteUsersToWorkspace(
    user: User,
    workspaceSlug: Workspace['slug'],
    members: WorkspaceMemberDTO[]
  ): Promise<void> {
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.ADD_USER],
        prisma: this.prisma
      })

    // Add users to the workspace if any
    if (members && members.length > 0) {
      await this.addMembersToWorkspace(workspace, user, members)

      await createEvent(
        {
          triggeredBy: user,
          entity: workspace,
          type: EventType.INVITED_TO_WORKSPACE,
          source: EventSource.WORKSPACE,
          title: `Invited users to workspace`,
          metadata: {
            workspaceId: workspace.id,
            name: workspace.name,
            members: members.map((m) => m.email)
          },
          workspaceId: workspace.id
        },
        this.prisma
      )

      this.log.debug(
        `Added users to workspace ${workspace.name} (${workspace.id})`
      )

      return
    }

    this.log.warn(
      `No users to add to workspace ${workspace.name} (${workspace.id})`
    )
  }

  /**
   * Removes users from a workspace.
   * @param user The user to remove users from the workspace for
   * @param workspaceSlug The slug of the workspace to remove users from
   * @param userEmails The emails of the users to remove from the workspace
   * @throws BadRequestException if the user is trying to remove themselves from the workspace,
   * or if the user is not a member of the workspace
   * @throws NotFoundException if the workspace or any of the users to remove do not exist
   * @throws InternalServerErrorException if there is an error in the transaction
   */
  async removeUsersFromWorkspace(
    user: User,
    workspaceSlug: Workspace['slug'],
    userEmails: User['email'][]
  ): Promise<void> {
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.REMOVE_USER],
        prisma: this.prisma
      })

    const userIds = await this.prisma.user
      .findMany({
        where: {
          email: {
            in: userEmails
          }
        },
        select: {
          id: true
        }
      })
      .then((users) => users.map((u) => u.id))

    // Remove users from the workspace if any
    if (userIds && userIds.length > 0) {
      if (userIds.find((id) => id === user.id)) {
        throw new BadRequestException(
          `You cannot remove yourself from the workspace. Please transfer the ownership to another member before leaving the workspace.`
        )
      }

      // Delete the membership
      await this.prisma.workspaceMember.deleteMany({
        where: {
          workspaceId: workspace.id,
          userId: {
            in: userIds
          }
        }
      })
    }

    await createEvent(
      {
        triggeredBy: user,
        entity: workspace,
        type: EventType.REMOVED_FROM_WORKSPACE,
        source: EventSource.WORKSPACE,
        title: `Removed users from workspace`,
        metadata: {
          workspaceId: workspace.id,
          name: workspace.name,
          members: userIds
        },
        workspaceId: workspace.id
      },
      this.prisma
    )

    this.log.debug(
      `Removed users from workspace ${workspace.name} (${workspace.id})`
    )
  }

  /**
   * Updates the roles of a user in a workspace.
   *
   * @throws NotFoundException if the user is not a member of the workspace
   * @throws BadRequestException if the admin role is tried to be assigned to the user
   * @param user The user to update the roles for
   * @param workspaceSlug The slug of the workspace to update the roles in
   * @param otherUserEmail The email of the user to update the roles for
   * @param roleSlugs The slugs of the roles to assign to the user
   */
  async updateMemberRoles(
    user: User,
    workspaceSlug: Workspace['slug'],
    otherUserEmail: User['email'],
    roleSlugs: WorkspaceRole['slug'][]
  ): Promise<void> {
    const otherUser = await getUserByEmail(otherUserEmail, this.prisma)

    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.UPDATE_USER_ROLE],
        prisma: this.prisma
      })

    if (!roleSlugs || roleSlugs.length === 0) {
      this.log.warn(
        `No roles to update for user ${otherUserEmail} in workspace ${workspace.name} (${workspace.id})`
      )
    }

    // Check if the member in concern is a part of the workspace or not
    if (!(await this.memberExistsInWorkspace(workspace.id, otherUser.id)))
      throw new NotFoundException(
        `${otherUser.email} is not a member of workspace ${workspace.name} (${workspace.slug})`
      )

    const workspaceAdminRole = await this.getWorkspaceAdminRole(workspace.id)

    // Check if the admin role is tried to be assigned to the user
    if (roleSlugs.includes(workspaceAdminRole.slug)) {
      throw new BadRequestException(`Admin role cannot be assigned to the user`)
    }

    // Update the role of the user
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: otherUser.id
        }
      }
    })

    // Clear out the existing roles
    const deleteExistingAssociations =
      this.prisma.workspaceMemberRoleAssociation.deleteMany({
        where: {
          workspaceMemberId: membership.id
        }
      })

    const roleSet = new Set<WorkspaceRole>()

    for (const slug of roleSlugs) {
      const role = await this.prisma.workspaceRole.findUnique({
        where: {
          slug
        }
      })

      if (!role) {
        throw new NotFoundException(`Role ${slug} not found`)
      }

      roleSet.add(role)
    }

    // Create new associations
    const createNewAssociations =
      this.prisma.workspaceMemberRoleAssociation.createMany({
        data: Array.from(roleSet).map((role) => ({
          roleId: role.id,
          workspaceMemberId: membership.id
        }))
      })

    await this.prisma.$transaction([
      deleteExistingAssociations,
      createNewAssociations
    ])

    await createEvent(
      {
        triggeredBy: user,
        entity: workspace,
        type: EventType.WORKSPACE_MEMBERSHIP_UPDATED,
        source: EventSource.WORKSPACE,
        title: `Updated role of user in workspace`,
        metadata: {
          workspaceId: workspace.id,
          name: workspace.name,
          userId: otherUser.id,
          roleIds: roleSlugs
        },
        workspaceId: workspace.id
      },
      this.prisma
    )

    this.log.debug(
      `Updated role of user ${otherUser.id} in workspace ${workspace.name} (${workspace.id})`
    )
  }

  /**
   * Gets all members of a workspace, paginated.
   * @param user The user to get the members for
   * @param workspaceSlug The slug of the workspace to get the members from
   * @param page The page number to get
   * @param limit The number of items per page to get
   * @param sort The field to sort by
   * @param order The order to sort in
   * @param search The search string to filter by
   * @returns The members of the workspace, paginated, with metadata
   */
  async getAllMembersOfWorkspace(
    user: User,
    workspaceSlug: Workspace['slug'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.READ_USERS],
        prisma: this.prisma
      })
    //get all members of workspace for page with limit
    const items = await this.prisma.workspaceMember.findMany({
      skip: page * limit,
      take: limit,
      orderBy: {
        workspace: {
          [sort]: order
        }
      },
      where: {
        workspaceId: workspace.id,
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

    //calculate metadata for pagination
    const totalCount = await this.prisma.workspaceMember.count({
      where: {
        workspaceId: workspace.id,
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
      }
    })

    const metadata = paginate(
      totalCount,
      `/workspace/${workspace.slug}/members`,
      {
        page,
        limit: limitMaxItemsPerPage(limit),
        sort,
        order,
        search
      }
    )

    return { items, metadata }
  }

  /**
   * Accepts an invitation to a workspace.
   * @param user The user to accept the invitation for
   * @param workspaceSlug The slug of the workspace to accept the invitation for
   * @throws BadRequestException if the user does not have a pending invitation to the workspace
   * @throws NotFoundException if the workspace does not exist
   * @throws InternalServerErrorException if there is an error in the transaction
   */
  async acceptInvitation(
    user: User,
    workspaceSlug: Workspace['slug']
  ): Promise<void> {
    // Check if the user has a pending invitation to the workspace
    await this.checkInvitationPending(workspaceSlug, user)

    const workspace = await this.prisma.workspace.findUnique({
      where: {
        slug: workspaceSlug
      }
    })

    // Update the membership
    await this.prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: user.id
        }
      },
      data: {
        invitationAccepted: true
      }
    })

    await createEvent(
      {
        triggeredBy: user,
        entity: workspace,
        type: EventType.ACCEPTED_INVITATION,
        source: EventSource.WORKSPACE,
        title: `${user.name} accepted invitation to workspace ${workspace.name}`,
        metadata: {
          workspaceId: workspace.id
        },
        workspaceId: workspace.id
      },
      this.prisma
    )

    this.log.debug(
      `User ${user.name} (${user.id}) accepted invitation to workspace ${workspace.id}`
    )
  }

  /**
   * Cancels an invitation to a workspace.
   * @param user The user cancelling the invitation
   * @param workspaceSlug The slug of the workspace to cancel the invitation for
   * @param inviteeEmail The email of the user to cancel the invitation for
   * @throws BadRequestException if the user does not have a pending invitation to the workspace
   * @throws NotFoundException if the workspace or the user to cancel the invitation for do not exist
   * @throws InternalServerErrorException if there is an error in the transaction
   */
  async cancelInvitation(
    user: User,
    workspaceSlug: Workspace['slug'],
    inviteeEmail: User['email']
  ): Promise<void> {
    const inviteeUser = await getUserByEmail(inviteeEmail, this.prisma)

    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.REMOVE_USER],
        prisma: this.prisma
      })

    // Check if the user has a pending invitation to the workspace
    await this.checkInvitationPending(workspaceSlug, inviteeUser)

    // Delete the membership
    await this.deleteMembership(workspace.id, inviteeUser.id)

    await createEvent(
      {
        triggeredBy: user,
        entity: workspace,
        type: EventType.CANCELLED_INVITATION,
        source: EventSource.WORKSPACE,
        title: `Cancelled invitation to workspace`,
        metadata: {
          workspaceId: workspace.id,
          inviteeId: inviteeUser.id
        },
        workspaceId: workspace.id
      },
      this.prisma
    )

    this.log.debug(
      `User ${user.name} (${user.id}) cancelled invitation to workspace ${workspace.id}`
    )
  }

  /**
   * Declines an invitation to a workspace.
   * @param user The user declining the invitation
   * @param workspaceSlug The slug of the workspace to decline the invitation for
   * @throws BadRequestException if the user does not have a pending invitation to the workspace
   * @throws NotFoundException if the workspace does not exist
   * @throws InternalServerErrorException if there is an error in the transaction
   */
  async declineInvitation(
    user: User,
    workspaceSlug: Workspace['slug']
  ): Promise<void> {
    // Check if the user has a pending invitation to the workspace
    await this.checkInvitationPending(workspaceSlug, user)

    const workspace = await this.prisma.workspace.findUnique({
      where: {
        slug: workspaceSlug
      }
    })

    // Delete the membership
    await this.deleteMembership(workspace.id, user.id)

    await createEvent(
      {
        triggeredBy: user,
        entity: workspace,
        type: EventType.DECLINED_INVITATION,
        source: EventSource.WORKSPACE,
        title: `${user.name} declined invitation to workspace ${workspace.name}`,
        metadata: {
          workspaceId: workspace.id
        },
        workspaceId: workspace.id
      },
      this.prisma
    )

    this.log.debug(
      `User ${user.name} (${user.id}) declined invitation to workspace ${workspace.id}`
    )
  }

  /**
   * Leaves a workspace.
   * @throws BadRequestException if the user is the owner of the workspace
   * @param user The user to leave the workspace for
   * @param workspaceSlug The slug of the workspace to leave
   */
  async leaveWorkspace(
    user: User,
    workspaceSlug: Workspace['slug']
  ): Promise<void> {
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.READ_WORKSPACE],
        prisma: this.prisma
      })

    const workspaceOwnerId = await this.prisma.workspace
      .findUnique({
        where: {
          id: workspace.id
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

    // Delete the membership
    await this.deleteMembership(workspace.id, user.id)

    await createEvent(
      {
        triggeredBy: user,
        entity: workspace,
        type: EventType.LEFT_WORKSPACE,
        source: EventSource.WORKSPACE,
        title: `User left workspace`,
        metadata: {
          workspaceId: workspace.id
        },
        workspaceId: workspace.id
      },
      this.prisma
    )

    this.log.debug(
      `User ${user.name} (${user.id}) left workspace ${workspace.id}`
    )
  }

  /**
   * Checks if a user is a member of a workspace.
   * @param user The user to check if the other user is a member of the workspace for
   * @param workspaceSlug The slug of the workspace to check if the user is a member of
   * @param otherUserEmail The email of the user to check if is a member of the workspace
   * @returns True if the user is a member of the workspace, false otherwise
   */
  async isUserMemberOfWorkspace(
    user: User,
    workspaceSlug: Workspace['slug'],
    otherUserEmail: User['email']
  ): Promise<boolean> {
    const otherUser = await getUserByEmail(otherUserEmail, this.prisma)

    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.READ_USERS],
        prisma: this.prisma
      })

    return await this.memberExistsInWorkspace(workspace.id, otherUser.id)
  }

  /**
   * Gets a workspace by its slug.
   * @param user The user to get the workspace for
   * @param workspaceSlug The slug of the workspace to get
   * @returns The workspace
   * @throws NotFoundException if the workspace does not exist or the user does not have the authority to read the workspace
   */
  async getWorkspaceBySlug(
    user: User,
    workspaceSlug: Workspace['slug']
  ): Promise<Workspace> {
    return await this.authorityCheckerService.checkAuthorityOverWorkspace({
      userId: user.id,
      entity: { slug: workspaceSlug },
      authorities: [Authority.READ_USERS],
      prisma: this.prisma
    })
  }

  /**
   * Gets all workspaces of a user, paginated.
   * @param user The user to get the workspaces for
   * @param page The page number to get
   * @param limit The number of items per page to get
   * @param sort The field to sort by
   * @param order The order to sort in
   * @param search The search string to filter by
   * @returns The workspaces of the user, paginated, with metadata
   */
  async getWorkspacesOfUser(
    user: User,
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    //get all workspaces of user for page with limit
    const items = await this.prisma.workspace.findMany({
      skip: page * limit,
      take: Number(limit),
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

    // get total count of workspaces of the user
    const totalCount = await this.prisma.workspace.count({
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

    //calculate metadata for pagination
    const metadata = paginate(totalCount, `/workspace`, {
      page,
      limit: limitMaxItemsPerPage(limit),
      sort,
      order,
      search
    })

    return { items, metadata }
  }

  /**
   * Exports all data of a workspace, including its roles, projects, environments, variables and secrets.
   * @param user The user to export the data for
   * @param workspaceSlug The slug of the workspace to export
   * @returns The exported data
   * @throws NotFoundException if the workspace does not exist or the user does not have the authority to read the workspace
   * @throws InternalServerErrorException if there is an error in the transaction
   */
  async exportData(user: User, workspaceSlug: Workspace['slug']) {
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.WORKSPACE_ADMIN],
        prisma: this.prisma
      })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}

    data.name = workspace.name
    data.description = workspace.description

    // Get all the roles of the workspace
    data.workspaceRoles = await this.prisma.workspaceRole.findMany({
      where: {
        workspaceId: workspace.id
      },
      select: {
        name: true,
        description: true,
        colorCode: true,
        hasAdminAuthority: true,
        authorities: true,
        projects: {
          select: {
            id: true
          }
        }
      }
    })

    // Get all projects, environments, variables and secrets of the workspace
    data.projects = await this.prisma.project.findMany({
      where: {
        workspaceId: workspace.id
      },
      select: {
        name: true,
        description: true,
        publicKey: true,
        privateKey: true,
        storePrivateKey: true,
        accessLevel: true,
        environments: {
          select: {
            name: true,
            description: true
          }
        },
        secrets: {
          select: {
            name: true,
            rotateAt: true,
            note: true,
            versions: {
              select: {
                value: true,
                version: true
              }
            }
          }
        },
        variables: {
          select: {
            name: true,
            note: true,
            versions: {
              select: {
                value: true,
                version: true
              }
            }
          }
        }
      }
    })

    return data
  }

  /**
   * Searches for projects, environments, secrets and variables
   * based on a search term. The search is scoped to the workspace
   * and the user's permissions.
   * @param user The user to search for
   * @param workspaceSlug The slug of the workspace to search in
   * @param searchTerm The search term to search for
   * @returns An object with the search results
   */
  async globalSearch(
    user: User,
    workspaceSlug: Workspace['slug'],
    searchTerm: string
  ): Promise<{
    projects: Partial<Project>[]
    environments: Partial<Environment>[]
    secrets: Partial<Secret>[]
    variables: Partial<Variable>[]
  }> {
    // Check authority over workspace
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [
          Authority.READ_WORKSPACE,
          Authority.READ_PROJECT,
          Authority.READ_ENVIRONMENT,
          Authority.READ_SECRET,
          Authority.READ_VARIABLE
        ],
        prisma: this.prisma
      })

    // Get a list of project IDs that the user has access to READ
    const accessibleProjectIds = await this.getAccessibleProjectIds(
      user.id,
      workspace.id
    )

    // Query all entities based on the search term and permissions
    const projects = await this.queryProjects(accessibleProjectIds, searchTerm)
    const environments = await this.queryEnvironments(
      accessibleProjectIds,
      searchTerm
    )
    const secrets = await this.querySecrets(accessibleProjectIds, searchTerm)
    const variables = await this.queryVariables(
      accessibleProjectIds,
      searchTerm
    )

    return { projects, environments, secrets, variables }
  }

  /**
   * Gets a list of project IDs that the user has access to READ.
   * The user has access to a project if the project is global or if the user has the READ_PROJECT authority.
   * @param userId The ID of the user to get the accessible project IDs for
   * @param workspaceId The ID of the workspace to get the accessible project IDs for
   * @returns The list of project IDs that the user has access to READ
   * @private
   */
  private async getAccessibleProjectIds(
    userId: string,
    workspaceId: string
  ): Promise<string[]> {
    const projects = await this.prisma.project.findMany({
      where: { workspaceId }
    })

    const accessibleProjectIds: string[] = []
    for (const project of projects) {
      if (project.accessLevel === ProjectAccessLevel.GLOBAL) {
        accessibleProjectIds.push(project.id)
      }

      const authorities = await getCollectiveProjectAuthorities(
        userId,
        project,
        this.prisma
      )
      if (
        authorities.has(Authority.READ_PROJECT) ||
        authorities.has(Authority.WORKSPACE_ADMIN)
      ) {
        accessibleProjectIds.push(project.id)
      }
    }
    return accessibleProjectIds
  }

  /**
   * Queries projects by IDs and search term.
   * @param projectIds The IDs of projects to query
   * @param searchTerm The search term to query by
   * @returns The projects that match the search term
   * @private
   */
  private async queryProjects(
    projectIds: string[],
    searchTerm: string
  ): Promise<Partial<Project>[]> {
    // Fetch projects where user has READ_PROJECT authority and match search term
    return this.prisma.project.findMany({
      where: {
        id: { in: projectIds },
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, description: true }
    })
  }

  /**
   * Queries environments by IDs and search term.
   * @param projectIds The IDs of projects to query
   * @param searchTerm The search term to query by
   * @returns The environments that match the search term
   * @private
   */
  private async queryEnvironments(
    projectIds: string[],
    searchTerm: string
  ): Promise<Partial<Environment>[]> {
    return this.prisma.environment.findMany({
      where: {
        project: {
          id: { in: projectIds }
        },
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, description: true }
    })
  }

  /**
   * Queries secrets by IDs and search term.
   * @param projectIds The IDs of projects to query
   * @param searchTerm The search term to query by
   * @returns The secrets that match the search term
   * @private
   */
  private async querySecrets(
    projectIds: string[],
    searchTerm: string
  ): Promise<Partial<Secret>[]> {
    // Fetch secrets associated with projects user has READ_SECRET authority on
    return await this.prisma.secret.findMany({
      where: {
        project: {
          id: { in: projectIds }
        },
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { note: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, note: true }
    })
  }

  /**
   * Queries variables by IDs and search term.
   * @param projectIds The IDs of projects to query
   * @param searchTerm The search term to query by
   * @returns The variables that match the search term
   * @private
   */
  private async queryVariables(
    projectIds: string[],
    searchTerm: string
  ): Promise<Partial<Variable>[]> {
    return this.prisma.variable.findMany({
      where: {
        project: {
          id: { in: projectIds }
        },
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { note: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, note: true }
    })
  }

  /**
   * Checks if a workspace with the given name exists for the given user.
   * @param name The name of the workspace to check for
   * @param userId The ID of the user to check for
   * @returns True if the workspace exists, false otherwise
   * @private
   */
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

  private async getWorkspaceAdminRole(
    workspaceId: Workspace['id']
  ): Promise<WorkspaceRole> {
    const adminRole = await this.prisma.workspaceRole.findFirst({
      where: {
        hasAdminAuthority: true,
        workspaceId
      }
    })

    if (!adminRole) {
      throw new InternalServerErrorException(
        `Admin role not found for workspace ${workspaceId}`
      )
    }

    return adminRole
  }

  /**
   * Adds members to a workspace.
   * @param workspace The workspace to add members to
   * @param currentUser The user performing the action
   * @param members The members to add to the workspace
   * @throws BadRequestException if the admin role is tried to be assigned to the user
   * @throws ConflictException if the user is already a member of the workspace
   * @throws InternalServerErrorException if there is an error in the transaction
   * @private
   */
  private async addMembersToWorkspace(
    workspace: Workspace,
    currentUser: User,
    members: WorkspaceMemberDTO[]
  ) {
    const workspaceAdminRole = await this.getWorkspaceAdminRole(workspace.id)

    for (const member of members) {
      // Check if the admin role is tried to be assigned to the user
      if (member.roleSlugs.includes(workspaceAdminRole.slug)) {
        throw new BadRequestException(
          `Admin role cannot be assigned to the user`
        )
      }

      const memberUser: User | null = await this.prisma.user.findUnique({
        where: {
          email: member.email
        }
      })

      const userId = memberUser?.id ?? v4()

      // Check if the user is already a member of the workspace
      if (
        memberUser &&
        (await this.memberExistsInWorkspace(workspace.id, userId))
      ) {
        this.log.warn(
          `User ${
            memberUser.name ?? 'NO_NAME_YET'
          } (${userId}) is already a member of workspace ${workspace.name} (${
            workspace.slug
          }). Skipping.`
        )
        throw new ConflictException(
          `User ${memberUser.name} (${userId}) is already a member of workspace ${workspace.name} (${workspace.slug})`
        )
      }

      const roleSet = new Set<WorkspaceRole>()

      for (const slug of member.roleSlugs) {
        const role = await this.prisma.workspaceRole.findUnique({
          where: {
            slug
          }
        })

        if (!role) {
          throw new NotFoundException(`Workspace role ${slug} does not exist`)
        }

        roleSet.add(role)
      }

      // Create the workspace membership
      const createMembership = this.prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          roles: {
            create: Array.from(roleSet).map((role) => ({
              role: {
                connect: {
                  id: role.id
                }
              }
            }))
          }
        }
      })

      if (memberUser) {
        await this.prisma.$transaction([createMembership])

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
            id: userId,
            email: member.email,
            isOnboardingFinished: false
          }
        })

        await this.prisma.$transaction([createMember, createMembership])

        this.log.debug(`Created non-registered user ${memberUser}`)

        this.mailService.workspaceInvitationMailForUsers(
          member.email,
          workspace.name,
          `${process.env.WORKSPACE_FRONTEND_URL}/workspace/${
            workspace.id
          }/join?token=${await this.jwt.signAsync({
            id: userId
          })}`,
          currentUser.name,
          false
        )

        this.log.debug(
          `Sent workspace invitation mail to non-registered user ${memberUser}`
        )
      }

      this.log.debug(`Added user ${memberUser} to workspace ${workspace.name}.`)
    }
  }

  /**
   * Checks if a user is a member of a workspace.
   * @param workspaceId The ID of the workspace to check
   * @param userId The ID of the user to check
   * @returns True if the user is a member of the workspace, false otherwise
   * @private
   */
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

  /**
   * Gets the workspace membership of a user in a workspace.
   * @param workspaceId The ID of the workspace to get the membership for
   * @param userId The ID of the user to get the membership for
   * @returns The workspace membership of the user in the workspace
   * @private
   */
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

  /**
   * Deletes the membership of a user in a workspace.
   * @param workspaceId The ID of the workspace to delete the membership from
   * @param userId The ID of the user to delete the membership for
   * @returns A promise that resolves when the membership is deleted
   * @private
   */
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

  /**
   * Checks if a user has a pending invitation to a workspace.
   * @throws BadRequestException if the user is not invited to the workspace
   * @param workspaceSlug The slug of the workspace to check if the user is invited to
   * @param user The user to check if the user is invited to the workspace
   */
  private async checkInvitationPending(
    workspaceSlug: Workspace['slug'],
    user: User
  ): Promise<void> {
    const membershipExists = await this.prisma.workspaceMember
      .count({
        where: {
          workspace: {
            slug: workspaceSlug
          },
          userId: user.id,
          invitationAccepted: false
        }
      })
      .then((count) => count > 0)

    if (!membershipExists)
      throw new BadRequestException(
        `${user.email} is not invited to workspace ${workspaceSlug}`
      )
  }
}
