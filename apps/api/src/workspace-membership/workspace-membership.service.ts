import { paginate } from '@/common/paginate'
import { createUser, getUserByEmailOrId } from '@/common/user'
import { IMailService, MAIL_SERVICE } from '@/mail/services/interface.service'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthorizationService } from '@/auth/service/authorization.service'
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import {
  Authority,
  AuthProvider,
  EventSource,
  EventType,
  User,
  Workspace,
  WorkspaceMember,
  WorkspaceRole
} from '@prisma/client'
import { v4 } from 'uuid'
import { CreateWorkspaceMember } from './dto/create.workspace/create.workspace-membership'
import { createEvent } from '@/common/event'
import { constructErrorBody, limitMaxItemsPerPage } from '@/common/util'
import { AuthenticatedUser } from '@/user/user.types'
import { TierLimitService } from '@/common/tier-limit.service'
import SlugGenerator from '@/common/slug-generator.service'

@Injectable()
export class WorkspaceMembershipService {
  private readonly log = new Logger(WorkspaceMembershipService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly jwt: JwtService,
    private readonly tierLimitService: TierLimitService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService,
    private readonly slugGenerator: SlugGenerator
  ) {}

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
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    otherUserEmail: User['email']
  ): Promise<void> {
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.WORKSPACE_ADMIN]
      })

    const otherUser = await getUserByEmailOrId(
      otherUserEmail,
      this.prisma,
      this.slugGenerator
    )

    if (otherUser.id === user.id) {
      throw new BadRequestException(
        constructErrorBody(
          'You cannot transfer ownership to yourself',
          `You are already the owner of this workspace`
        )
      )
    }

    // We don't want the users to be able to transfer
    // ownership if the workspace is the default workspace
    if (workspace.isDefault) {
      throw new BadRequestException(
        constructErrorBody(
          'Can not transfer default workspace ownership',
          `You cannot transfer ownership of a default workspace.`
        )
      )
    }

    const workspaceMembership = await this.getWorkspaceMembership(
      workspace.id,
      otherUser.id
    )

    // Check if the user is a member of the workspace
    if (!workspaceMembership) {
      throw new NotFoundException(
        constructErrorBody(
          'You are not a member of this workspace',
          `Could not resolve your access to this workspace. If you think this is a mistake, please get in touch with the workspace admin.`
        )
      )
    }

    // Check if the user has accepted the invitation
    if (!workspaceMembership.invitationAccepted) {
      throw new BadRequestException(
        constructErrorBody(
          'You have not accepted the invitation',
          `Your invitation to this workspace is still pending. Check the invitations tab to accept the invitation.`
        )
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
   * Invites users to a workspace.
   * @param user The user to invite the users for
   * @param workspaceSlug The slug of the workspace to invite users to
   * @param members The members to invite
   * @throws BadRequestException if the user does not have the authority to add users to the workspace
   * @throws NotFoundException if the workspace or any of the users to invite do not exist
   * @throws InternalServerErrorException if there is an error in the transaction
   */
  async inviteUsersToWorkspace(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    members: CreateWorkspaceMember[]
  ): Promise<void> {
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.ADD_USER]
      })

    // Check if more members can be added to the workspace
    await this.tierLimitService.checkMemberLimitReached(workspace)

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
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    userEmails: User['email'][]
  ): Promise<void> {
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.REMOVE_USER]
      })

    const userIds = await this.prisma.user
      .findMany({
        where: {
          email: {
            in: userEmails.map((email) => email.toLowerCase())
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
          constructErrorBody(
            `You can not remove yourself from the workspace.`,
            `You can only leave a workspace.`
          )
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

      const member = await getUserByEmailOrId(
        user.email,
        this.prisma,
        this.slugGenerator
      )

      if (member.emailPreference && !member.emailPreference.activity) {
        this.log.log(`User ${member.id} has opted out of receiving invitations`)
        throw new BadRequestException(
          constructErrorBody(
            'User has opted out',
            'The user has opted out of receiving invitations'
          )
        )
      }

      // Send an email to the removed users
      const removedOn = new Date()
      const emailPromises = userEmails.map((userEmail) =>
        this.mailService.removedFromWorkspace(
          userEmail,
          workspace.name,
          removedOn
        )
      )

      await Promise.all(emailPromises)
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
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    otherUserEmail: User['email'],
    roleSlugs: WorkspaceRole['slug'][]
  ): Promise<void> {
    const otherUser = await getUserByEmailOrId(
      otherUserEmail,
      this.prisma,
      this.slugGenerator
    )

    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.UPDATE_USER_ROLE]
      })

    if (!roleSlugs || roleSlugs.length === 0) {
      this.log.warn(
        `No roles to update for user ${otherUserEmail} in workspace ${workspace.name} (${workspace.id})`
      )
    }

    // Check if the member in concern is a part of the workspace or not
    if (!(await this.memberExistsInWorkspace(workspace.id, otherUser.id)))
      throw new NotFoundException(
        constructErrorBody(
          'User is not a member of the workspace',
          'Please check the teams tab to confirm whether the user is a member of this workspace'
        )
      )

    const workspaceAdminRole = await this.getWorkspaceAdminRole(workspace.id)

    // Check if the admin role is tried to be assigned to the user
    if (roleSlugs.includes(workspaceAdminRole.slug)) {
      throw new BadRequestException(
        constructErrorBody(
          'This role can not be assigned',
          'You can not assign admin role to other members of the workspace'
        )
      )
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
        throw new NotFoundException(
          constructErrorBody(
            'Role not found',
            `Role ${slug} not found in the workspace ${workspace.name} (${workspace.id})`
          )
        )
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
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.READ_USERS]
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
                contains: search.toLowerCase()
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
                slug: true,
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
        },
        invitationAccepted: true,
        createdOn: true
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
                contains: search.toLowerCase()
              }
            }
          ]
        }
      }
    })

    const metadata = paginate(
      totalCount,
      `/workspace-membership/${workspace.slug}/members`,
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
    user: AuthenticatedUser,
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
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    inviteeEmail: User['email']
  ): Promise<void> {
    const inviteeUser = await getUserByEmailOrId(
      inviteeEmail,
      this.prisma,
      this.slugGenerator
    )

    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.REMOVE_USER]
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
    user: AuthenticatedUser,
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
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug']
  ): Promise<void> {
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.READ_WORKSPACE]
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
        constructErrorBody(
          'Can not leave workspace',
          'You cannot leave the workspace as you are the owner of the workspace. Please transfer the ownership to another member before leaving the workspace.'
        )
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
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    otherUserEmail: User['email']
  ): Promise<boolean> {
    let otherUser: User | null = null

    try {
      otherUser = await getUserByEmailOrId(
        otherUserEmail,
        this.prisma,
        this.slugGenerator
      )
    } catch (e) {
      return false
    }

    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.READ_USERS]
      })

    return await this.memberExistsInWorkspace(workspace.id, otherUser.id)
  }

  async resendInvitation(
    user: AuthenticatedUser,
    inviteeEmail: User['email'],
    workspaceSlug: Workspace['slug']
  ): Promise<void> {
    this.log.log(
      `User ${user.id} requested to resend invitation to workspace ${workspaceSlug} for user ${inviteeEmail}`
    )

    // Fetch the invitee user
    const member = await getUserByEmailOrId(
      inviteeEmail,
      this.prisma,
      this.slugGenerator
    )

    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.READ_WORKSPACE, Authority.ADD_USER]
      })

    this.log.log(
      `Checking if user ${member.id} is a member of workspace ${workspace.id}`
    )
    // Check if the membership exists
    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspace.id,
        userId: member.id,
        invitationAccepted: false
      }
    })

    if (!membership) {
      this.log.error(
        `User ${member.id} is not a member of workspace ${workspace.id}`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Membership not found',
          'You are trying to invite someone who has not been invited before'
        )
      )
    }

    if (member.emailPreference && !member.emailPreference.critical) {
      this.log.log(
        `User ${member.id} has opted out of receiving critical notifications`
      )
      throw new BadRequestException(
        constructErrorBody(
          'User has opted out',
          'The user has opted out of receiving critical notifications'
        )
      )
    }

    // Resend the invitation
    this.log.log(
      `Resending invitation to user ${member.id} for workspace ${workspace.id}`
    )
    this.mailService.invitedToWorkspace(
      member.email,
      workspace.name,
      `${process.env.PLATFORM_FRONTEND_URL}/settings?tab=invites`,
      user.name,
      membership.createdOn.toISOString(),
      true
    )

    this.log.log(
      `Invitation resent to user ${member.id} for workspace ${workspace.id}`
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
    currentUser: AuthenticatedUser,
    members: CreateWorkspaceMember[]
  ) {
    const workspaceAdminRole = await this.getWorkspaceAdminRole(workspace.id)

    for (const member of members) {
      // Check if the admin role is tried to be assigned to the user
      if (member.roleSlugs.includes(workspaceAdminRole.slug)) {
        throw new BadRequestException(
          constructErrorBody(
            'Admin role cannot be assigned to the user',
            'You can not assign the admin role to the user. Please check the teams tab to confirm whether the user is a member of this workspace'
          )
        )
      }

      const memberUser: User | null = await this.prisma.user.findUnique({
        where: {
          email: member.email.toLowerCase()
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
            memberUser.name || memberUser.email
          } (${userId}) is already a member of workspace ${workspace.name} (${
            workspace.slug
          }). Skipping.`
        )
        throw new ConflictException(
          constructErrorBody(
            `User ${memberUser.name || memberUser.email} is already a member of this workspace`,
            'Please check the teams tab to confirm whether the user is a member of this workspace'
          )
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
          throw new NotFoundException(
            constructErrorBody(
              `Workspace role ${slug} does not exist`,
              `Please check the workspace roles to confirm whether the role exists`
            )
          )
        }

        roleSet.add(role)
      }

      const invitedOn = new Date()

      // Create the workspace membership
      const createMembership = this.prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          createdOn: invitedOn,
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

        this.mailService.invitedToWorkspace(
          member.email,
          workspace.name,
          `${process.env.PLATFORM_FRONTEND_URL}/settings?tab=invites`,
          currentUser.name,
          invitedOn.toISOString(),
          true
        )

        this.log.debug(
          `Sent workspace invitation mail to registered user ${memberUser}`
        )
      } else {
        // Create the user
        await createUser(
          {
            id: userId,
            email: member.email,
            authProvider: AuthProvider.EMAIL_OTP
          },
          this.prisma,
          this.slugGenerator
        )

        await this.prisma.$transaction([createMembership])

        this.log.debug(`Created non-registered user ${memberUser}`)

        this.mailService.invitedToWorkspace(
          member.email,
          workspace.name,
          `${process.env.PLATFORM_FRONTEND_URL}/settings?tab=invites`,
          currentUser.name,
          new Date().toISOString(),
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
        constructErrorBody(
          'User is not invited to the workspace',
          `${user.email} is not invited to workspace ${workspaceSlug}`
        )
      )
  }
}
