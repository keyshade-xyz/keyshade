import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import {
  Authority,
  EventSource,
  EventType,
  User,
  Workspace,
  WorkspaceRole
} from '@prisma/client'
import { CreateWorkspaceRole } from '../dto/create-workspace-role/create-workspace-role'
import { UpdateWorkspaceRole } from '../dto/update-workspace-role/update-workspace-role'
import { PrismaService } from '@/prisma/prisma.service'
import { WorkspaceRoleWithProjects } from '../workspace-role.types'
import { v4 } from 'uuid'
import { AuthorityCheckerService } from '@/common/authority-checker.service'
import { paginate, PaginatedMetadata } from '@/common/paginate'
import generateEntitySlug from '@/common/slug-generator'
import { createEvent } from '@/common/event'
import { getCollectiveWorkspaceAuthorities } from '@/common/collective-authorities'
import { limitMaxItemsPerPage } from '@/common/util'

@Injectable()
export class WorkspaceRoleService {
  private readonly logger: Logger = new Logger(WorkspaceRoleService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityCheckerService: AuthorityCheckerService
  ) {}

  /**
   * Creates a new workspace role
   * @throws {BadRequestException} if the role has workspace admin authority
   * @throws {ConflictException} if a workspace role with the same name already exists
   * @param user the user that is creating the workspace role
   * @param workspaceSlug the slug of the workspace
   * @param dto the data for the new workspace role
   * @returns the newly created workspace role
   */
  async createWorkspaceRole(
    user: User,
    workspaceSlug: Workspace['slug'],
    dto: CreateWorkspaceRole
  ) {
    if (
      dto.authorities &&
      dto.authorities.includes(Authority.WORKSPACE_ADMIN)
    ) {
      throw new BadRequestException(
        'You can not explicitly assign workspace admin authority to a role'
      )
    }

    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.CREATE_WORKSPACE_ROLE],
        prisma: this.prisma
      })
    const workspaceId = workspace.id

    if (await this.checkWorkspaceRoleExists(user, workspaceSlug, dto.name)) {
      throw new ConflictException(
        'Workspace role with the same name already exists'
      )
    }

    const workspaceRoleId = v4()

    const op = []

    // Create the workspace role
    op.push(
      this.prisma.workspaceRole.create({
        data: {
          id: workspaceRoleId,
          name: dto.name,
          slug: await generateEntitySlug(dto.name, 'API_KEY', this.prisma),
          description: dto.description,
          colorCode: dto.colorCode,
          authorities: dto.authorities ?? [],
          hasAdminAuthority: false,
          workspace: {
            connect: {
              id: workspaceId
            }
          }
        },
        include: {
          projects: {
            select: {
              project: {
                select: {
                  id: true,
                  slug: true,
                  name: true
                }
              }
            }
          }
        }
      })
    )

    if (dto.projectSlugs) {
      // Create the project associations
      const projectSlugToIdMap = await this.getProjectSlugToIdMap(
        dto.projectSlugs
      )

      if (dto.projectSlugs && dto.projectSlugs.length > 0) {
        op.push(
          this.prisma.projectWorkspaceRoleAssociation.createMany({
            data: dto.projectSlugs.map((projectSlug) => ({
              roleId: workspaceRoleId,
              projectId: projectSlugToIdMap.get(projectSlug)
            }))
          })
        )
      }
    }

    const workspaceRole = (await this.prisma.$transaction(op))[0]

    await createEvent(
      {
        triggeredBy: user,
        entity: workspaceRole,
        type: EventType.WORKSPACE_ROLE_CREATED,
        source: EventSource.WORKSPACE_ROLE,
        title: `Workspace role created`,
        metadata: {
          workspaceRoleId: workspaceRole.id,
          name: workspaceRole.name,
          workspaceId,
          workspaceName: workspace.name
        },
        workspaceId
      },
      this.prisma
    )

    this.logger.log(
      `${user.email} created workspace role ${workspaceRole.slug}`
    )

    return workspaceRole
  }

  /**
   * Updates a workspace role
   * @throws {BadRequestException} if the role has workspace admin authority
   * @throws {ConflictException} if a workspace role with the same name already exists
   * @param user the user that is updating the workspace role
   * @param workspaceRoleSlug the slug of the workspace role to be updated
   * @param dto the data for the updated workspace role
   * @returns the updated workspace role
   */
  async updateWorkspaceRole(
    user: User,
    workspaceRoleSlug: WorkspaceRole['slug'],
    dto: UpdateWorkspaceRole
  ) {
    if (
      dto.authorities &&
      dto.authorities.includes(Authority.WORKSPACE_ADMIN)
    ) {
      throw new BadRequestException(
        'You can not explicitly assign workspace admin authority to a role'
      )
    }

    const workspaceRole = (await this.getWorkspaceRoleWithAuthority(
      user.id,
      workspaceRoleSlug,
      Authority.UPDATE_WORKSPACE_ROLE
    )) as WorkspaceRoleWithProjects
    const workspaceRoleId = workspaceRole.id

    const { slug: workspaceSlug } = await this.prisma.workspace.findUnique({
      where: {
        id: workspaceRole.workspaceId
      },
      select: {
        slug: true
      }
    })

    if (
      dto.name &&
      ((await this.checkWorkspaceRoleExists(user, workspaceSlug, dto.name)) ||
        dto.name === workspaceRole.name)
    ) {
      throw new ConflictException(
        'Workspace role with the same name already exists'
      )
    }

    if (dto.projectSlugs) {
      await this.prisma.projectWorkspaceRoleAssociation.deleteMany({
        where: {
          roleId: workspaceRoleId
        }
      })

      const projectSlugToIdMap = await this.getProjectSlugToIdMap(
        dto.projectSlugs
      )

      await this.prisma.projectWorkspaceRoleAssociation.createMany({
        data: dto.projectSlugs.map((projectSlug) => ({
          roleId: workspaceRoleId,
          projectId: projectSlugToIdMap.get(projectSlug)
        }))
      })
    }

    const updatedWorkspaceRole = await this.prisma.workspaceRole.update({
      where: {
        id: workspaceRoleId
      },
      data: {
        name: dto.name,
        description: dto.description,
        colorCode: dto.colorCode,
        authorities: dto.authorities
      },
      include: {
        projects: {
          select: {
            project: {
              select: {
                id: true,
                slug: true,
                name: true
              }
            }
          }
        }
      }
    })

    await createEvent(
      {
        triggeredBy: user,
        entity: workspaceRole,
        type: EventType.WORKSPACE_ROLE_UPDATED,
        source: EventSource.WORKSPACE_ROLE,
        title: `Workspace role updated`,
        metadata: {
          workspaceRoleId: workspaceRole.id,
          name: workspaceRole.name,
          workspaceId: workspaceRole.workspaceId
        },
        workspaceId: workspaceRole.workspaceId
      },
      this.prisma
    )

    this.logger.log(`${user.email} updated workspace role ${workspaceRoleSlug}`)

    return updatedWorkspaceRole
  }

  /**
   * Deletes a workspace role
   * @throws {UnauthorizedException} if the role has administrative authority
   * @param user the user that is deleting the workspace role
   * @param workspaceRoleSlug the slug of the workspace role to be deleted
   */
  async deleteWorkspaceRole(
    user: User,
    workspaceRoleSlug: WorkspaceRole['slug']
  ) {
    const workspaceRole = await this.getWorkspaceRoleWithAuthority(
      user.id,
      workspaceRoleSlug,
      Authority.DELETE_WORKSPACE_ROLE
    )
    const workspaceRoleId = workspaceRole.id

    if (workspaceRole.hasAdminAuthority) {
      throw new UnauthorizedException(
        'Cannot delete workspace role with administrative authority'
      )
    }

    await this.prisma.workspaceRole.delete({
      where: {
        id: workspaceRoleId
      }
    })

    await createEvent(
      {
        triggeredBy: user,
        type: EventType.WORKSPACE_ROLE_DELETED,
        source: EventSource.WORKSPACE_ROLE,
        title: `Workspace role deleted`,
        entity: workspaceRole,
        metadata: {
          workspaceRoleId: workspaceRole.id,
          name: workspaceRole.name,
          workspaceId: workspaceRole.workspaceId
        },
        workspaceId: workspaceRole.workspaceId
      },
      this.prisma
    )

    this.logger.log(`${user.email} deleted workspace role ${workspaceRoleSlug}`)
  }

  /**
   * Checks if a workspace role with the given name exists
   * @throws {UnauthorizedException} if the user does not have the required authority
   * @param user the user performing the check
   * @param workspaceSlug the slug of the workspace
   * @param name the name of the workspace role to check
   * @returns true if a workspace role with the given name exists, false otherwise
   */
  async checkWorkspaceRoleExists(
    user: User,
    workspaceSlug: Workspace['slug'],
    name: string
  ) {
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.READ_WORKSPACE_ROLE],
        prisma: this.prisma
      })
    const workspaceId = workspace.id

    return (
      (await this.prisma.workspaceRole.count({
        where: {
          workspaceId,
          name
        }
      })) > 0
    )
  }

  /**
   * Gets a workspace role by its slug
   * @throws {UnauthorizedException} if the user does not have the required authority
   * @param user the user performing the request
   * @param workspaceRoleSlug the slug of the workspace role to get
   * @returns the workspace role with the given slug
   */
  async getWorkspaceRole(
    user: User,
    workspaceRoleSlug: WorkspaceRole['slug']
  ): Promise<WorkspaceRole> {
    return await this.getWorkspaceRoleWithAuthority(
      user.id,
      workspaceRoleSlug,
      Authority.READ_WORKSPACE_ROLE
    )
  }

  /**
   * Gets all workspace roles of a workspace, with pagination and optional filtering by name
   * @throws {UnauthorizedException} if the user does not have the required authority
   * @param user the user performing the request
   * @param workspaceSlug the slug of the workspace
   * @param page the page to get (0-indexed)
   * @param limit the maximum number of items to return
   * @param sort the field to sort the results by (e.g. "name", "slug", etc.)
   * @param order the order to sort the results in (e.g. "asc", "desc")
   * @param search an optional search string to filter the results by
   * @returns a PaginatedMetadata object containing the items and metadata
   */
  async getWorkspaceRolesOfWorkspace(
    user: User,
    workspaceSlug: Workspace['slug'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<{ items: WorkspaceRole[]; metadata: PaginatedMetadata }> {
    const { id: workspaceId } =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.READ_WORKSPACE_ROLE],
        prisma: this.prisma
      })
    //get workspace roles of a workspace for given page and limit
    const items = await this.prisma.workspaceRole.findMany({
      where: {
        workspaceId,
        name: {
          contains: search
        }
      },
      skip: page * limit,
      take: limitMaxItemsPerPage(limit),

      orderBy: {
        [sort]: order
      }
    })

    //calculate metadata
    const totalCount = await this.prisma.workspaceRole.count({
      where: {
        workspaceId,
        name: {
          contains: search
        }
      }
    })

    const metadata = paginate(
      totalCount,
      `/workspace-role/${workspaceSlug}/all`,
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
   * Gets a workspace role by its slug, with additional authorities check
   * @throws {NotFoundException} if the workspace role does not exist
   * @throws {UnauthorizedException} if the user does not have the required authority
   * @param userId the user that is performing the request
   * @param workspaceRoleSlug the slug of the workspace role to get
   * @param authorities the authorities to check against
   * @returns the workspace role with the given slug
   */
  private async getWorkspaceRoleWithAuthority(
    userId: User['id'],
    workspaceRoleSlug: Workspace['slug'],
    authorities: Authority
  ) {
    const workspaceRole = (await this.prisma.workspaceRole.findUnique({
      where: {
        slug: workspaceRoleSlug
      },
      include: {
        projects: {
          select: {
            project: {
              select: {
                id: true,
                slug: true,
                name: true
              }
            }
          }
        }
      }
    })) as WorkspaceRoleWithProjects

    if (!workspaceRole) {
      throw new NotFoundException(
        `Workspace role ${workspaceRoleSlug} not found`
      )
    }

    const permittedAuthorities = await getCollectiveWorkspaceAuthorities(
      workspaceRole.workspaceId,
      userId,
      this.prisma
    )

    if (
      !permittedAuthorities.has(authorities) &&
      !permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
    ) {
      throw new UnauthorizedException(
        `User ${userId} does not have the required authorities to perform the action`
      )
    }

    return workspaceRole
  }

  /**
   * Given an array of project slugs, returns a Map of slug to id for all projects
   * found in the database.
   *
   * @param projectSlugs the array of project slugs
   * @returns a Map of project slug to id
   */
  private async getProjectSlugToIdMap(projectSlugs: string[]) {
    const projects = await this.prisma.project.findMany({
      where: {
        slug: {
          in: projectSlugs
        }
      }
    })

    return new Map(projects.map((project) => [project.slug, project.id]))
  }
}
