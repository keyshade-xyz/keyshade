import { AuthorityCheckerService } from '@/common/authority-checker.service'
import { getCollectiveProjectAuthorities } from '@/common/collective-authorities'
import { createEvent } from '@/common/event'
import { paginate } from '@/common/paginate'
import generateEntitySlug from '@/common/slug-generator'
import { limitMaxItemsPerPage } from '@/common/util'
import {
  createWorkspace
} from '@/common/workspace'
import { IMailService, MAIL_SERVICE } from '@/mail/services/interface.service'
import { PrismaService } from '@/prisma/prisma.service'
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
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
  Workspace
} from '@prisma/client'
import {
  CreateWorkspace,
} from '../dto/create.workspace/create.workspace'
import { UpdateWorkspace } from '../dto/update.workspace/update.workspace'
<<<<<<< HEAD
=======
import { v4 } from 'uuid'
import createEvent from '../../common/create-event'
import createWorkspace from '../../common/create-workspace'
import { AuthorityCheckerService } from '../../common/authority-checker.service'
>>>>>>> 6ac6f14 (Revert "Fix: merge conflicts")

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
   * Gets a workspace by its slug.
   * @param user The user to get the workspace for
   * @param workspaceSlug The slug of the workspace to get
   * @returns The workspace
   * @throws NotFoundException if the workspace does not exist or the user does not have the authority to read the workspace
   */
  async getWorkspaceBySlug(
    user: User,
<<<<<<< HEAD
    workspaceSlug: Workspace['slug']
=======
    workspaceId: Workspace['id'],
    members: WorkspaceMemberDTO[]
  ): Promise<void> {
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { id: workspaceId },
        authority: Authority.ADD_USER,
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

  async removeUsersFromWorkspace(
    user: User,
    workspaceId: Workspace['id'],
    userIds: User['id'][]
  ): Promise<void> {
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { id: workspaceId },
        authority: Authority.REMOVE_USER,
        prisma: this.prisma
      })

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
          workspaceId,
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

  async updateMemberRoles(
    user: User,
    workspaceId: Workspace['id'],
    userId: User['id'],
    roleIds: WorkspaceRole['id'][]
  ): Promise<void> {
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { id: workspaceId },
        authority: Authority.UPDATE_USER_ROLE,
        prisma: this.prisma
      })

    if (!roleIds || roleIds.length === 0) {
      this.log.warn(
        `No roles to update for user ${userId} in workspace ${workspace.name} (${workspace.id})`
      )
    }

    // Check if the member in concern is a part of the workspace or not
    if (!(await this.memberExistsInWorkspace(workspaceId, userId)))
      throw new NotFoundException(
        `User ${userId} is not a member of workspace ${workspace.name} (${workspace.id})`
      )

    const workspaceAdminRole = await this.getWorkspaceAdminRole(workspaceId)

    // Check if the admin role is tried to be assigned to the user
    if (roleIds.includes(workspaceAdminRole.id)) {
      throw new BadRequestException(`Admin role cannot be assigned to the user`)
    }

    // Update the role of the user
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId
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

    // Create new associations
    const createNewAssociations =
      this.prisma.workspaceMemberRoleAssociation.createMany({
        data: roleIds.map((roleId) => ({
          roleId,
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
          userId,
          roleIds
        },
        workspaceId: workspace.id
      },
      this.prisma
    )

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
    await this.authorityCheckerService.checkAuthorityOverWorkspace({
      userId: user.id,
      entity: { id: workspaceId },
      authority: Authority.READ_USERS,
      prisma: this.prisma
    })

    return this.prisma.workspaceMember.findMany({
      skip: page * limit,
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
    await this.checkInvitationPending(workspaceId, user.id)

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

    const workspace = await this.prisma.workspace.findUnique({
      where: {
        id: workspaceId
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
          workspaceId: workspaceId
        },
        workspaceId: workspace.id
      },
      this.prisma
    )

    this.log.debug(
      `User ${user.name} (${user.id}) accepted invitation to workspace ${workspaceId}`
    )
  }

  async cancelInvitation(
    user: User,
    workspaceId: Workspace['id'],
    inviteeId: User['id']
  ): Promise<void> {
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { id: workspaceId },
        authority: Authority.REMOVE_USER,
        prisma: this.prisma
      })

    // Check if the user has a pending invitation to the workspace
    if (!(await this.invitationPending(workspaceId, inviteeId)))
      throw new BadRequestException(
        `User ${inviteeId} is not invited to workspace ${workspaceId}`
      )

    // Delete the membership
    await this.deleteMembership(workspaceId, inviteeId)

    await createEvent(
      {
        triggeredBy: user,
        entity: workspace,
        type: EventType.CANCELLED_INVITATION,
        source: EventSource.WORKSPACE,
        title: `Cancelled invitation to workspace`,
        metadata: {
          workspaceId: workspaceId,
          inviteeId
        },
        workspaceId: workspace.id
      },
      this.prisma
    )

    this.log.debug(
      `User ${user.name} (${user.id}) cancelled invitation to workspace ${workspaceId}`
    )
  }

  async declineInvitation(
    user: User,
    workspaceId: Workspace['id']
  ): Promise<void> {
    // Check if the user has a pending invitation to the workspace
    await this.checkInvitationPending(workspaceId, user.id)

    // Delete the membership
    await this.deleteMembership(workspaceId, user.id)

    const workspace = await this.prisma.workspace.findUnique({
      where: {
        id: workspaceId
      }
    })

    await createEvent(
      {
        triggeredBy: user,
        entity: workspace,
        type: EventType.DECLINED_INVITATION,
        source: EventSource.WORKSPACE,
        title: `${user.name} declined invitation to workspace ${workspace.name}`,
        metadata: {
          workspaceId: workspaceId
        },
        workspaceId: workspace.id
      },
      this.prisma
    )

    this.log.debug(
      `User ${user.name} (${user.id}) declined invitation to workspace ${workspaceId}`
    )
  }

  async leaveWorkspace(
    user: User,
    workspaceId: Workspace['id']
  ): Promise<void> {
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { id: workspaceId },
        authority: Authority.READ_WORKSPACE,
        prisma: this.prisma
      })

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

    // Delete the membership
    await this.deleteMembership(workspaceId, user.id)

    await createEvent(
      {
        triggeredBy: user,
        entity: workspace,
        type: EventType.LEFT_WORKSPACE,
        source: EventSource.WORKSPACE,
        title: `User left workspace`,
        metadata: {
          workspaceId: workspaceId
        },
        workspaceId: workspace.id
      },
      this.prisma
    )

    this.log.debug(
      `User ${user.name} (${user.id}) left workspace ${workspaceId}`
    )
  }

  async isUserMemberOfWorkspace(
    user: User,
    workspaceId: Workspace['id'],
    otherUserId: User['id']
  ): Promise<boolean> {
    await this.authorityCheckerService.checkAuthorityOverWorkspace({
      userId: user.id,
      entity: { id: workspaceId },
      authority: Authority.READ_USERS,
      prisma: this.prisma
    })

    return await this.memberExistsInWorkspace(workspaceId, otherUserId)
  }

  async getWorkspaceById(
    user: User,
    workspaceId: Workspace['id']
>>>>>>> 6ac6f14 (Revert "Fix: merge conflicts")
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
    return this.prisma.workspace.findMany({
      skip: page * limit,
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
<<<<<<< HEAD

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
=======
>>>>>>> 6ac6f14 (Revert "Fix: merge conflicts")
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
}
