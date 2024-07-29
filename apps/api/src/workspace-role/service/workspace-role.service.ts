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
import getCollectiveWorkspaceAuthorities from '../../common/get-collective-workspace-authorities'
import { UpdateWorkspaceRole } from '../dto/update-workspace-role/update-workspace-role'
import { PrismaService } from '../../prisma/prisma.service'
import createEvent from '../../common/create-event'
import { WorkspaceRoleWithProjects } from '../workspace-role.types'
import { v4 } from 'uuid'
import { AuthorityCheckerService } from '../../common/authority-checker.service'
import { paginate, PaginatedMetadata } from '../../common/paginate'

@Injectable()
export class WorkspaceRoleService {
  private readonly logger: Logger = new Logger(WorkspaceRoleService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityCheckerService: AuthorityCheckerService
  ) {}

  async createWorkspaceRole(
    user: User,
    workspaceId: Workspace['id'],
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
        entity: { id: workspaceId },
        authority: Authority.CREATE_WORKSPACE_ROLE,
        prisma: this.prisma
      })

    if (await this.checkWorkspaceRoleExists(user, workspaceId, dto.name)) {
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
              projectId: true
            }
          }
        }
      })
    )

    // Create the project associations
    if (dto.projectIds && dto.projectIds.length > 0) {
      op.push(
        this.prisma.projectWorkspaceRoleAssociation.createMany({
          data: dto.projectIds.map((projectId) => ({
            roleId: workspaceRoleId,
            projectId
          }))
        })
      )
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
      `User with id ${user.id} created workspace role with id ${workspaceRole.id}`
    )

    return workspaceRole
  }

  async updateWorkspaceRole(
    user: User,
    workspaceRoleId: WorkspaceRole['id'],
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

    let workspaceRole = (await this.getWorkspaceRoleWithAuthority(
      user.id,
      workspaceRoleId,
      Authority.UPDATE_WORKSPACE_ROLE
    )) as WorkspaceRoleWithProjects

    if (
      dto.name &&
      ((await this.checkWorkspaceRoleExists(
        user,
        workspaceRole.workspaceId,
        dto.name
      )) ||
        dto.name === workspaceRole.name)
    ) {
      throw new ConflictException(
        'Workspace role with the same name already exists'
      )
    }

    if (dto.projectIds) {
      await this.prisma.projectWorkspaceRoleAssociation.deleteMany({
        where: {
          roleId: workspaceRoleId
        }
      })

      await this.prisma.projectWorkspaceRoleAssociation.createMany({
        data: dto.projectIds.map((projectId) => ({
          roleId: workspaceRoleId,
          projectId
        }))
      })
    }

    workspaceRole = await this.prisma.workspaceRole.update({
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
            projectId: true
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

    this.logger.log(
      `User with id ${user.id} updated workspace role with id ${workspaceRoleId}`
    )

    return workspaceRole
  }

  async deleteWorkspaceRole(user: User, workspaceRoleId: WorkspaceRole['id']) {
    const workspaceRole = await this.getWorkspaceRoleWithAuthority(
      user.id,
      workspaceRoleId,
      Authority.DELETE_WORKSPACE_ROLE
    )

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

    this.logger.log(
      `User with id ${user.id} deleted workspace role with id ${workspaceRoleId}`
    )
  }

  async checkWorkspaceRoleExists(
    user: User,
    workspaceId: Workspace['id'],
    name: string
  ) {
    await this.authorityCheckerService.checkAuthorityOverWorkspace({
      userId: user.id,
      entity: { id: workspaceId },
      authority: Authority.READ_WORKSPACE_ROLE,
      prisma: this.prisma
    })

    return (
      (await this.prisma.workspaceRole.count({
        where: {
          workspaceId,
          name
        }
      })) > 0
    )
  }

  async getWorkspaceRole(
    user: User,
    workspaceRoleId: WorkspaceRole['id']
  ): Promise<WorkspaceRole> {
    return await this.getWorkspaceRoleWithAuthority(
      user.id,
      workspaceRoleId,
      Authority.READ_WORKSPACE_ROLE
    )
  }

  async getWorkspaceRolesOfWorkspace(
    user: User,
    workspaceId: Workspace['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<{ items: WorkspaceRole[]; metadata: PaginatedMetadata }> {
    await this.authorityCheckerService.checkAuthorityOverWorkspace({
      userId: user.id,
      entity: { id: workspaceId },
      authority: Authority.READ_WORKSPACE_ROLE,
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
      take: limit,
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
      `/workspace-role/${workspaceId}/all`,
      {
        page,
        limit,
        sort,
        order,
        search
      }
    )

    return { items, metadata }
  }

  private async getWorkspaceRoleWithAuthority(
    userId: User['id'],
    workspaceRoleId: Workspace['id'],
    authority: Authority
  ) {
    const workspaceRole = (await this.prisma.workspaceRole.findUnique({
      where: {
        id: workspaceRoleId
      },
      include: {
        projects: true
      }
    })) as WorkspaceRoleWithProjects

    if (!workspaceRole) {
      throw new NotFoundException(
        `Workspace role with id ${workspaceRoleId} not found`
      )
    }

    const permittedAuthorities = await getCollectiveWorkspaceAuthorities(
      workspaceRole.workspaceId,
      userId,
      this.prisma
    )

    if (
      !permittedAuthorities.has(authority) &&
      !permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
    ) {
      throw new UnauthorizedException(
        `User ${userId} does not have the required authorities to perform the action`
      )
    }

    return workspaceRole
  }
}
