// eslint-disable-next-line prettier/prettier
import { getCollectiveProjectAuthorities } from '@/common/collective-authorities'
import { createEvent } from '@/common/event'
import { paginate } from '@/common/paginate'
import generateEntitySlug from '@/common/slug-generator'
import { constructErrorBody, limitMaxItemsPerPage } from '@/common/util'
import { createWorkspace } from '@/common/workspace'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthorizationService } from '@/auth/service/authorization.service'
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger
} from '@nestjs/common'
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
import { CreateWorkspace } from './dto/create.workspace/create.workspace'
import { UpdateWorkspace } from './dto/update.workspace/update.workspace'
import { AuthenticatedUser } from '@/user/user.types'
import { UpdateBlacklistedIpAddresses } from './dto/update.blacklistedIpAddresses/update.blacklistedIpAddresses'
import { TierLimitService } from '@/common/tier-limit.service'

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly tierLimitService: TierLimitService
  ) {}

  /**
   * Creates a new workspace for the given user.
   * @throws ConflictException if the workspace with the same name already exists
   * @param user The user to create the workspace for
   * @param dto The data to create the workspace with
   * @returns The created workspace
   */
  async createWorkspace(user: AuthenticatedUser, dto: CreateWorkspace) {
    this.logger.log(
      `User ${user.id} attempted to create a workspace ${dto.name}`
    )

    await this.existsByName(dto.name, user.id)

    const newWorkspace = await createWorkspace(user, dto, this.prisma)

    return {
      ...newWorkspace,
      projects: await this.getProjectsOfWorkspace(newWorkspace, user),
      ...(await this.parseWorkspaceItemLimits(newWorkspace.id))
    }
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
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    dto: UpdateWorkspace
  ): Promise<Workspace> {
    this.logger.log(
      `User ${user.id} attempted to update a workspace ${workspaceSlug}`
    )

    // Fetch the workspace
    this.logger.log(
      `Checking if user has authority to update workspace ${workspaceSlug}`
    )
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.UPDATE_WORKSPACE]
      })

    // Check if a same named workspace already exists
    dto.name && (await this.existsByName(dto.name, user.id))

    // Update the workspace
    this.logger.log(`Updating workspace ${workspace.name} (${workspace.id})`)
    const updatedWorkspace = await this.prisma.workspace.update({
      where: {
        id: workspace.id
      },
      data: {
        name: dto.name === workspace.name ? undefined : dto.name,
        slug: dto.name
          ? await generateEntitySlug(dto.name, 'WORKSPACE', this.prisma)
          : undefined,
        icon: dto.icon,
        lastUpdatedBy: {
          connect: {
            id: user.id
          }
        }
      }
    })
    this.logger.debug(`Updated workspace ${workspace.name} (${workspace.id})`)

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
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug']
  ): Promise<void> {
    this.logger.log(
      `User ${user.id} attempted to delete workspace ${workspaceSlug}`
    )

    // Fetch the workspace
    this.logger.log(
      `Checking if user has authority to delete workspace ${workspaceSlug}`
    )
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.DELETE_WORKSPACE]
      })

    // We don't want the users to delete their default workspace
    this.logger.log(
      `Checking if workspace ${workspace.name} is a default workspace`
    )
    if (workspace.isDefault) {
      this.logger.log(`Workspace ${workspace.name} is a default workspace`)
      throw new BadRequestException(
        constructErrorBody(
          'Can not delete default workspace',
          `You can not delete the default workspace.`
        )
      )
    } else {
      this.logger.log(`Workspace ${workspace.name} is not a default workspace`)
    }

    // Delete the workspace
    this.logger.log(`Deleting workspace ${workspace.name} (${workspace.slug})`)
    await this.prisma.workspace.delete({
      where: {
        id: workspace.id
      }
    })

    this.logger.debug(`Deleted workspace ${workspace.name} (${workspace.slug})`)
  }

  /**
   * Gets a workspace by its slug.
   * @param user The user to get the workspace for
   * @param workspaceSlug The slug of the workspace to get
   * @returns The workspace
   * @throws NotFoundException if the workspace does not exist or the user does not have the authority to read the workspace
   */
  async getWorkspaceBySlug(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to get workspace ${workspaceSlug}`
    )

    // Fetch the workspace
    this.logger.log(
      `Checking if user has authority to read workspace ${workspaceSlug}`
    )
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.READ_USERS]
      })

    return {
      ...workspace,
      isDefault: workspace.isDefault && workspace.ownerId === user.id,
      projects: await this.getProjectsOfWorkspace(workspace, user),
      ...(await this.parseWorkspaceItemLimits(workspace.id))
    }
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
    user: AuthenticatedUser,
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    this.logger.log(`User ${user.id} attempted to get workspaces of self`)

    // Get all workspaces of user for page with limit
    this.logger.log(`Fetching workspaces of user ${user.id}`)
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

        name: {
          contains: search
        }
      }
    })

    this.logger.debug(
      `Fetched workspaces of user ${user.id}. Count: ${items.length}`
    )

    // Parsing projects of workspaces
    this.logger.log(`Parsing projects of workspaces of user ${user.id}`)
    for (const workspace of items) {
      this.logger.debug(`Parsing projects of workspace ${workspace.slug}`)
      workspace['projects'] = await this.getProjectsOfWorkspace(workspace, user)
      this.logger.debug(`Parsed projects of workspace ${workspace.slug}`)
    }

    // get total count of workspaces of the user
    const totalCount = await this.prisma.workspace.count({
      where: {
        members: {
          some: {
            userId: user.id
          }
        },

        name: {
          contains: search
        }
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

    return {
      items: await Promise.all(
        items.map(async (item) => ({
          ...item,
          isDefault: item.isDefault && item.ownerId === user.id,
          ...(await this.parseWorkspaceItemLimits(item.id))
        }))
      ),
      metadata
    }
  }

  /**
   * Exports all data of a workspace, including its roles, projects, environments, variables and secrets.
   * @param user The user to export the data for
   * @param workspaceSlug The slug of the workspace to export
   * @returns The exported data
   * @throws NotFoundException if the workspace does not exist or the user does not have the authority to read the workspace
   * @throws InternalServerErrorException if there is an error in the transaction
   */
  async exportData(user: AuthenticatedUser, workspaceSlug: Workspace['slug']) {
    this.logger.log(
      `User ${user.id} attempted to export workspace data of ${workspaceSlug}`
    )

    // Fetch the workspace
    this.logger.log(
      `Checking if user has authority to read workspace ${workspaceSlug}`
    )
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.WORKSPACE_ADMIN]
      })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}

    data.name = workspace.name
    data.icon = workspace.icon

    // Get all the roles of the workspace
    this.logger.log(`Fetching roles of workspace ${workspace.slug}`)
    data.workspaceRoles = await this.prisma.workspaceRole.findMany({
      where: {
        workspaceId: workspace.id
      },
      select: {
        name: true,
        description: true,
        colorCode: true,
        hasAdminAuthority: true,
        authorities: true
      }
    })

    // Get all projects, environments, variables and secrets of the workspace
    this.logger.log(`Fetching projects of workspace ${workspace.slug}`)
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
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    searchTerm: string
  ): Promise<{
    projects: Partial<Project>[]
    environments: Partial<Environment>[]
    secrets: Partial<Secret>[]
    variables: Partial<Variable>[]
  }> {
    this.logger.log(
      `User ${user.id} attempted to search in workspace ${workspaceSlug}`
    )

    // Check authority over workspace
    this.logger.log(
      `Checking if user has authority to read workspace ${workspaceSlug}`
    )
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [
          Authority.READ_WORKSPACE,
          Authority.READ_PROJECT,
          Authority.READ_ENVIRONMENT,
          Authority.READ_SECRET,
          Authority.READ_VARIABLE
        ]
      })

    // Get a list of project IDs that the user has access to READ
    this.logger.log(
      `Fetching a list of project IDs the user has access to READ`
    )
    const accessibleProjectIds = await this.getAccessibleProjectIds(
      user.id,
      workspace.id
    )
    this.logger.log(
      `User ${user.id} has access to ${accessibleProjectIds.length} projects`
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

    this.logger.log(
      `Found ${projects.length} projects, ${environments.length} environments, ${secrets.length} secrets and ${variables.length} variables as search results`
    )

    return { projects, environments, secrets, variables }
  }

  /**
   * Gets all the invitations a user has to various workspaces, paginated.
   * @param user The user to get the workspaces for
   * @param page The page number to get
   * @param limit The number of items per page to get
   * @param sort The field to sort by
   * @param order The order to sort in
   * @param search The search string to filter by
   * @returns The workspace invitations of the user, paginated, with metadata
   */
  async getAllWorkspaceInvitations(
    user: AuthenticatedUser,
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    this.logger.log(`User ${user.id} attempted to get workspace invitations`)

    // Fetch all workspaces of user where they are not admin
    this.logger.log(`Fetching workspaces of user ${user.id}`)
    const items = await this.prisma.workspaceMember.findMany({
      skip: page * limit,
      take: limitMaxItemsPerPage(Number(limit)),
      orderBy: {
        workspace: {
          [sort]: order
        }
      },
      where: {
        userId: user.id,
        invitationAccepted: false,
        workspace: {
          name: {
            contains: search
          }
        },
        roles: {
          none: {
            role: {
              hasAdminAuthority: true
            }
          }
        }
      },
      select: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true
          }
        },
        roles: {
          select: {
            role: {
              select: {
                name: true,
                colorCode: true
              }
            }
          }
        },
        createdOn: true
      }
    })

    this.logger.log(`Found ${items.length} workspace invitations`)

    // Get total count of workspaces of the user
    const totalCount = await this.prisma.workspaceMember.count({
      where: {
        userId: user.id,
        invitationAccepted: false,
        workspace: {
          name: {
            contains: search
          }
        },
        roles: {
          none: {
            role: {
              hasAdminAuthority: true
            }
          }
        }
      }
    })

    // Calculate metadata for pagination
    const metadata = paginate(totalCount, `/workspace/invitations`, {
      page,
      limit: limitMaxItemsPerPage(limit),
      sort,
      order,
      search
    })

    return {
      items: items.map((item) => ({
        ...item,
        invitedOn: item.createdOn,
        createdOn: undefined
      })),
      metadata
    }
  }

  /**
   * Gets a list of blacklisted IP addresses.
   * @param user The user to get the workspace for
   * @param workspaceSlug The slug of the workspace to delete
   * @returns The list of IP addresses
   */
  async getBlacklistedIpAddresses(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug']
  ): Promise<string[]> {
    this.logger.log(
      `User ${user.id} attempted to get blacklisted IP addresses for workspace ${workspaceSlug}`
    )

    // Fetch the workspace
    this.logger.log(
      `Checking if user has authority to read workspace ${workspaceSlug}`
    )
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.WORKSPACE_ADMIN]
      })

    return workspace.blacklistedIpAddresses
  }

  /**
   * Updates the list of blacklisted IP addresses
   * @throws ConflictException if the workspace with the same name already exists
   * @param user The user to update the workspace for
   * @param workspaceSlug The slug of the workspace to update
   * @param dto The data to update the list of blacklisted IP addresses with
   * @returns The updated list of blacklisted IP addresses
   */
  async updateBlacklistedIpAddresses(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    dto: UpdateBlacklistedIpAddresses
  ) {
    this.logger.log(
      `User ${user.id} attempted to update blacklisted IP addresses for workspace ${workspaceSlug}`
    )

    // Fetch the workspace
    this.logger.log(
      `Checking if user has authority to update workspace ${workspaceSlug}`
    )
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.WORKSPACE_ADMIN]
      })

    // Update blacklisted IP addresses
    const updatedWorkspace = await this.prisma.workspace.update({
      where: {
        id: workspace.id
      },
      data: {
        blacklistedIpAddresses: dto.ipAddresses
      }
    })

    this.logger.debug(
      `Updated workspace blacklisted IP addresses ${workspace.name} (${workspace.id})`
    )

    await createEvent(
      {
        triggeredBy: user,
        entity: workspace,
        type: EventType.WORKSPACE_UPDATED,
        source: EventSource.WORKSPACE,
        title: `Workspace blacklisted IP addresses updated`,
        metadata: {
          workspaceId: workspace.id,
          name: workspace.name
        },
        workspaceId: workspace.id
      },
      this.prisma
    )

    return updatedWorkspace.blacklistedIpAddresses
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
      select: { slug: true, name: true, description: true }
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
      select: {
        slug: true,
        name: true,
        description: true,
        project: { select: { slug: true } }
      }
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
      select: {
        slug: true,
        name: true,
        note: true,
        project: { select: { slug: true } }
      }
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
      select: {
        slug: true,
        name: true,
        note: true,
        project: { select: { slug: true } }
      }
    })
  }

  /**
   * Checks if a workspace with the given name exists for the given user.
   * @param name The name of the workspace to check for
   * @param userId The ID of the user to check for
   * @throws ConflictException if the workspace already exists
   * @private
   */
  private async existsByName(name: string, userId: User['id']): Promise<void> {
    this.logger.log(`Checking if workspace ${name} exists for user ${userId}`)

    const workspaceExists =
      (await this.prisma.workspace.count({
        where: {
          name,
          ownerId: userId
        }
      })) > 0

    if (workspaceExists) {
      this.logger.log(`Workspace ${name} exists for user ${userId}`)
      throw new ConflictException(
        constructErrorBody(
          'Workspace already exists',
          `Workspace with name ${name} already exists`
        )
      )
    }

    this.logger.log(`Workspace ${name} does not exist for user ${userId}`)
  }

  /**
   * Retrieves the count of projects within a workspace that a user has permission to access.
   *
   * @param workspaceId The ID of the workspace to retrieve projects from.
   * @param userId The ID of the user whose access permissions are being checked.
   * @returns The number of projects the user has authority to access within the specified workspace.
   * @private
   */

  private async getProjectsOfWorkspace(
    workspace: Workspace,
    user: AuthenticatedUser
  ) {
    const projects = await this.prisma.project.findMany({
      where: {
        workspaceId: workspace.id
      }
    })

    let accessibleProjectCount = 0

    for (const project of projects) {
      const hasAuthority =
        await this.authorizationService.authorizeUserAccessToProject({
          user,
          entity: { slug: project.slug },
          authorities: [Authority.READ_PROJECT]
        })

      if (hasAuthority) {
        accessibleProjectCount++
      }
    }
    return accessibleProjectCount
  }

  /**
   * Parses the tier limits for a given workspace and returns an object containing
   * the maximum allowed and current total of members and projects.
   *
   * @param workspace The workspace to parse tier limits for.
   * @param tierLimitService The service used to obtain tier limits.
   * @param prisma The Prisma client for database operations.
   * @returns A promise that resolves to an object containing the workspace with
   * tier limits, including maximum allowed and total members and projects.
   */

  private async parseWorkspaceItemLimits(
    workspaceId: Workspace['id']
  ): Promise<{
    maxAllowedProjects: number
    totalProjects: number
    maxAllowedMembers: number
    totalMembers: number
  }> {
    this.logger.log(
      `Parsing workspace item limits for workspace ${workspaceId}`
    )

    this.logger.log(`Getting member tier limit for workspace ${workspaceId}`)
    // Get the tier limit for the members in the workspace
    const maxAllowedMembers =
      this.tierLimitService.getMemberTierLimit(workspaceId)

    // Get total members in the workspace
    const totalMembers = await this.prisma.workspaceMember.count({
      where: {
        workspaceId
      }
    })
    this.logger.log(`Found ${totalMembers} members in workspace ${workspaceId}`)

    this.logger.log(`Getting project tier limit for workspace ${workspaceId}`)
    // Get project tier limit
    const maxAllowedProjects =
      this.tierLimitService.getProjectTierLimit(workspaceId)

    // Get total projects in the workspace
    const totalProjects = await this.prisma.project.count({
      where: {
        workspaceId
      }
    })
    this.logger.log(
      `Found ${totalProjects} projects in workspace ${workspaceId}`
    )

    return {
      maxAllowedMembers,
      totalMembers,
      maxAllowedProjects,
      totalProjects
    }
  }
}
