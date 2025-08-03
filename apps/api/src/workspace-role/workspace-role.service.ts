import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common'
import {
  Authority,
  EventSource,
  EventType,
  Project,
  Workspace,
  WorkspaceMemberRoleAssociation,
  WorkspaceRole
} from '@prisma/client'
import { CreateWorkspaceRole } from './dto/create-workspace-role/create-workspace-role'
import { UpdateWorkspaceRole } from './dto/update-workspace-role/update-workspace-role'
import { PrismaService } from '@/prisma/prisma.service'
import { v4 } from 'uuid'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { paginate, PaginatedResponse } from '@/common/paginate'
import { createEvent } from '@/common/event'
import { constructErrorBody, limitMaxItemsPerPage } from '@/common/util'
import { AuthenticatedUser } from '@/user/user.types'
import SlugGenerator from '@/common/slug-generator.service'
import { HydratedWorkspaceRole, RawWorkspaceRole } from './workspace-role.types'
import { HydrationService } from '@/common/hydration.service'
import { InclusionQuery } from '@/common/inclusion-query'

@Injectable()
export class WorkspaceRoleService {
  private readonly logger: Logger = new Logger(WorkspaceRoleService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly slugGenerator: SlugGenerator,
    private readonly hydrationService: HydrationService
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
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    dto: CreateWorkspaceRole
  ): Promise<HydratedWorkspaceRole> {
    this.logger.log(
      `User ${user.id} attempted to create workspace role ${dto.name} in workspace ${workspaceSlug}`
    )

    this.checkAdminAuthorityPresence(dto.authorities)

    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        slug: workspaceSlug,
        authorities: [Authority.CREATE_WORKSPACE_ROLE]
      })
    const workspaceId = workspace.id

    if (workspace.isDisabled) {
      this.logger.log(
        `User ${user.id} attempted to create workspace role for disabled workspace ${workspaceSlug}`
      )
      throw new BadRequestException(
        constructErrorBody(
          'This workspace has been disabled',
          'To use the workspace again, remove the previum resources, or upgrade to a paid plan'
        )
      )
    }

    await this.checkWorkspaceRoleExists(workspace.id, dto.name)

    const workspaceRoleId = v4()

    const op = []

    // Create the workspace role
    op.push(
      this.prisma.workspaceRole.create({
        data: {
          id: workspaceRoleId,
          name: dto.name,
          slug: await this.slugGenerator.generateEntitySlug(
            dto.name,
            'WORKSPACE_ROLE'
          ),
          description: dto.description,
          colorCode: dto.colorCode,
          authorities: dto.authorities ?? ['READ_WORKSPACE'],
          hasAdminAuthority: false,
          workspace: {
            connect: {
              id: workspaceId
            }
          }
        }
      })
    )

    await this.parseProjectEnvironmentsDBOperation(
      dto.projectEnvironments,
      workspaceRoleId,
      user,
      op
    )

    // Fetch the new workspace role
    op.push(
      this.prisma.workspaceRole.findFirst({
        where: {
          id: workspaceRoleId
        },
        include: InclusionQuery.WorkspaceRole
      })
    )

    const workspaceRole = await this.parseWorkspaceRoleMembers(
      (await this.prisma.$transaction(op)).pop()
    )
    const hydratedWorkspaceRole =
      await this.hydrationService.hydrateWorkspaceRole({
        workspaceRole,
        user
      })
    delete hydratedWorkspaceRole.workspace

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

    return hydratedWorkspaceRole
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
    user: AuthenticatedUser,
    workspaceRoleSlug: WorkspaceRole['slug'],
    dto: UpdateWorkspaceRole
  ): Promise<HydratedWorkspaceRole> {
    this.logger.log(
      `User ${user.id} attempted to update workspace role ${workspaceRoleSlug}`
    )

    this.checkAdminAuthorityPresence(dto.authorities)

    const workspaceRole =
      await this.authorizationService.authorizeUserAccessToWorkspaceRole({
        user,
        slug: workspaceRoleSlug,
        authorities: [Authority.UPDATE_WORKSPACE_ROLE]
      })

    if (workspaceRole.hasAdminAuthority) {
      // For the admin role, only allow updating description and colorCode
      if (dto.authorities || dto.name) {
        throw new BadRequestException(
          constructErrorBody(
            'Cannot modify admin role authorities or name',
            'You cannot change the authorities or name of the admin role'
          )
        )
      }
    }

    const workspaceRoleId = workspaceRole.id

    await this.checkWorkspaceRoleExists(workspaceRole.workspaceId, dto.name)

    const op = []

    // Update project environment combo
    await this.parseProjectEnvironmentsDBOperation(
      dto.projectEnvironments,
      workspaceRoleId,
      user,
      op
    )

    // Update workspace role
    op.push(
      this.prisma.workspaceRole.update({
        where: {
          id: workspaceRoleId
        },
        data: {
          name: dto.name,
          slug: dto.name
            ? await this.slugGenerator.generateEntitySlug(
                dto.name,
                'WORKSPACE_ROLE'
              )
            : undefined,
          description: dto.description,
          colorCode: dto.colorCode,
          authorities: dto.authorities
        },
        include: InclusionQuery.WorkspaceRole
      })
    )

    const updatedWorkspaceRole = await this.parseWorkspaceRoleMembers(
      (await this.prisma.$transaction(op)).pop()
    )

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

    return await this.hydrationService.hydrateWorkspaceRole({
      workspaceRole: updatedWorkspaceRole,
      user
    })
  }

  /**
   * Deletes a workspace role
   * @throws {UnauthorizedException} if the role has administrative authority
   * @param user the user that is deleting the workspace role
   * @param workspaceRoleSlug the slug of the workspace role to be deleted
   */
  async deleteWorkspaceRole(
    user: AuthenticatedUser,
    workspaceRoleSlug: WorkspaceRole['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to delete workspace role ${workspaceRoleSlug}`
    )

    const workspaceRole =
      await this.authorizationService.authorizeUserAccessToWorkspaceRole({
        user,
        slug: workspaceRoleSlug,
        authorities: [Authority.DELETE_WORKSPACE_ROLE]
      })
    const workspaceRoleId = workspaceRole.id

    if (workspaceRole.hasAdminAuthority) {
      throw new UnauthorizedException(
        constructErrorBody(
          'Can not delete workspace role',
          'This role contains the workspace admin authority. You can not delete this role'
        )
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

    this.logger.log(
      `User ${user.id} deleted workspace role ${workspaceRoleSlug}`
    )
  }

  /**
   * Checks if a workspace role with the given name exists
   * @throws {UnauthorizedException} if the user does not have the required authority
   * @param workspace the workspace
   * @param name the name of the workspace role to check
   * @returns true if a workspace role with the given name exists, false otherwise
   */
  async checkWorkspaceRoleExists(
    workspaceId: Workspace['id'],
    name?: WorkspaceRole['name']
  ) {
    this.logger.log(
      `Checking if workspace role ${name} exists in workspace ${workspaceId}`
    )

    if (name) {
      const workspaceRoleExists =
        (await this.prisma.workspaceRole.count({
          where: {
            workspaceId,
            name
          }
        })) > 0

      if (workspaceRoleExists) {
        throw new ConflictException(
          constructErrorBody(
            'Workspace role already exists',
            `A workspace role with the name ${name} already exists in workspace ${workspaceId}`
          )
        )
      }
    }
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
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<PaginatedResponse<HydratedWorkspaceRole>> {
    const { id: workspaceId } =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        slug: workspaceSlug,
        authorities: [Authority.READ_WORKSPACE_ROLE]
      })

    // Get workspace roles of a workspace for given page and limit
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
      },
      include: InclusionQuery.WorkspaceRole
    })

    const hydratedWorkspaceRoles = []
    for (const workspaceRole of items) {
      const hydratedWorkspaceRole =
        await this.hydrationService.hydrateWorkspaceRole({
          workspaceRole: await this.parseWorkspaceRoleMembers(workspaceRole),
          user
        })
      delete hydratedWorkspaceRole.workspace
      hydratedWorkspaceRoles.push(hydratedWorkspaceRole)
    }

    // Calculate metadata
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

    return { items: hydratedWorkspaceRoles, metadata }
  }

  /**
   * Retrieves a map of project slugs to their corresponding IDs from the database.
   *
   * @param slugs - An array of project slugs.
   * @returns A Map where each key is a project slug and the value is the project ID.
   */
  private async getProjectSlugToIdMap(
    slugs: Project['slug'][],
    user: AuthenticatedUser
  ): Promise<Map<Project['slug'], Project['id']>> {
    const map = new Map<Project['slug'], Project['id']>()

    if (slugs.length === 0) {
      return map
    }

    for (const slug of slugs) {
      const project =
        await this.authorizationService.authorizeUserAccessToProject({
          slug,
          authorities: [Authority.READ_PROJECT],
          user
        })

      map.set(slug, project.id)
    }

    return map
  }

  /**
   * Parses the workspace members associated with the given workspace role.
   *
   * Given a workspace role, this function will fetch the associated workspace members
   * and their corresponding users, and parse the data into a simpler format to be
   * returned in the response.
   *
   * @param workspaceRole the workspace role to parse the members for
   * @returns the parsed workspace role with the associated members
   */
  private async parseWorkspaceRoleMembers<
    T extends RawWorkspaceRole & {
      workspaceMembers: WorkspaceMemberRoleAssociation[]
    }
  >(workspaceRole: T): Promise<RawWorkspaceRole> {
    const workspaceMemberIds = workspaceRole.workspaceMembers.map(
      (workspaceMember) => workspaceMember.workspaceMemberId
    )

    const workspaceMembers = await this.prisma.workspaceMember.findMany({
      where: { id: { in: workspaceMemberIds } }
    })

    const userIds = workspaceMembers.map(
      (workspaceMember) => workspaceMember.userId
    )

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } }
    })

    const members = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      profilePictureUrl: user.profilePictureUrl,
      memberSince: workspaceMembers.find(
        (workspaceMember) => workspaceMember.userId === user.id
      ).createdOn
    }))

    delete workspaceRole.workspaceMembers

    return {
      ...workspaceRole,
      members
    }
  }

  /**
   * Checks if the given authorities contains the workspace admin authority.
   * If it does, it throws a BadRequestException because workspace admin authority
   * can not be explicitly assigned to a role.
   * @param authorities the authorities to check
   */
  private checkAdminAuthorityPresence(authorities?: Authority[]): void {
    if (authorities?.includes(Authority.WORKSPACE_ADMIN)) {
      this.logger.error(
        `Attempted to create workspace role with workspace admin authority`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Can not add workspace admin authority',
          'You can not explicitly assign workspace admin authority to a role'
        )
      )
    }
  }

  private async parseProjectEnvironmentsDBOperation(
    projectEnvironments: CreateWorkspaceRole['projectEnvironments'],
    workspaceRoleId: WorkspaceRole['id'],
    user: AuthenticatedUser,
    op: any[]
  ): Promise<any[]> {
    if (projectEnvironments) {
      // Create the project associations
      const projectSlugToIdMap = await this.getProjectSlugToIdMap(
        projectEnvironments.map((pe) => pe.projectSlug),
        user
      )

      for (const pe of projectEnvironments) {
        const projectId = projectSlugToIdMap.get(pe.projectSlug)

        if (pe.environmentSlugs) {
          // Check if the user has read authority over all the environments
          for (const environmentSlug of pe.environmentSlugs) {
            const environment =
              await this.authorizationService.authorizeUserAccessToEnvironment({
                user,
                slug: environmentSlug,
                authorities: [Authority.READ_ENVIRONMENT]
              })

            // Check if the environment is part of the project
            if (environment.projectId !== projectId) {
              throw new BadRequestException(
                constructErrorBody(
                  'Invalid environment slugs',
                  `Environment ${environmentSlug} is not part of project ${pe.projectSlug}`
                )
              )
            }
          }
        }

        // Create the project workspace role association with the environments accessible on the project
        op.push(
          this.prisma.projectWorkspaceRoleAssociation.upsert({
            where: {
              roleId_projectId: {
                roleId: workspaceRoleId,
                projectId: projectId
              }
            },
            update: {
              environments: pe.environmentSlugs && {
                set: [],
                connect: pe.environmentSlugs.map((slug) => ({ slug }))
              }
            },
            create: {
              roleId: workspaceRoleId,
              projectId: projectId,
              environments: pe.environmentSlugs && {
                connect: pe.environmentSlugs.map((slug) => ({ slug }))
              }
            }
          })
        )
      }
    }
    return op
  }
}
