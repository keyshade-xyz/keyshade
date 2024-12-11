import { AuthorityCheckerService } from '@/common/authority-checker.service'
import { getCollectiveProjectAuthorities } from '@/common/collective-authorities'
import { createEvent } from '@/common/event'
import { paginate } from '@/common/paginate'
import generateEntitySlug from '@/common/slug-generator'
import { limitMaxItemsPerPage } from '@/common/util'
import { createWorkspace } from '@/common/workspace'
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
import { CreateWorkspace } from '../dto/create.workspace/create.workspace'
import { UpdateWorkspace } from '../dto/update.workspace/update.workspace'

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
        icon: dto.icon,
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

        name: {
          contains: search
        }
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
    data.icon = workspace.icon

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
        authorities: true
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
    user: User,
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    // fetch all workspaces of user where they are not admin
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

    // get total count of workspaces of the user
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

    //calculate metadata for pagination
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
      select: { slug: true, name: true, description: true }
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
      select: { slug: true, name: true, note: true }
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
      select: { slug: true, name: true, note: true }
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
