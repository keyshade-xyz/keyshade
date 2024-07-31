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
  User
} from '@prisma/client'
import { CreateEnvironment } from '../dto/create.environment/create.environment'
import { UpdateEnvironment } from '../dto/update.environment/update.environment'
import { PrismaService } from '../../prisma/prisma.service'
import createEvent from '../../common/create-event'
import { AuthorityCheckerService } from '../../common/authority-checker.service'
import { paginate } from '../../common/paginate'
import { limitMaxItemsPerPage } from '../../common/limit-max-items-per-page'

@Injectable()
export class EnvironmentService {
  private readonly logger = new Logger(EnvironmentService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityCheckerService: AuthorityCheckerService
  ) {}

  async createEnvironment(
    user: User,
    dto: CreateEnvironment,
    projectId: Project['id']
  ) {
    // Check if the user has the required role to create an environment
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: projectId },
        authority: Authority.CREATE_ENVIRONMENT,
        prisma: this.prisma
      })

    // Check if an environment with the same name already exists
    await this.environmentExists(dto.name, projectId)

    // Create the environment
    const environment = await this.prisma.environment.create({
      data: {
        name: dto.name,
        description: dto.description,
        project: {
          connect: {
            id: projectId
          }
        },
        lastUpdatedBy: {
          connect: {
            id: user.id
          }
        }
      }
    })

    await createEvent(
      {
        triggeredBy: user,
        entity: environment,
        type: EventType.ENVIRONMENT_ADDED,
        source: EventSource.ENVIRONMENT,
        title: `Environment created`,
        metadata: {
          environmentId: environment.id,
          name: environment.name,
          projectId,
          projectName: project.name
        },
        workspaceId: project.workspaceId
      },
      this.prisma
    )

    this.logger.log(
      `Environment ${environment.name} created in project ${project.name} (${project.id})`
    )

    return environment
  }

  async updateEnvironment(
    user: User,
    dto: UpdateEnvironment,
    environmentId: Environment['id']
  ) {
    const environment =
      await this.authorityCheckerService.checkAuthorityOverEnvironment({
        userId: user.id,
        entity: { id: environmentId },
        authority: Authority.UPDATE_ENVIRONMENT,
        prisma: this.prisma
      })

    // Check if an environment with the same name already exists
    dto.name && (await this.environmentExists(dto.name, environment.projectId))

    // Update the environment
    const updatedEnvironment = await this.prisma.environment.update({
      where: {
        id: environment.id
      },
      data: {
        name: dto.name,
        description: dto.description,
        lastUpdatedById: user.id
      }
    })

    const project = environment.project

    await createEvent(
      {
        triggeredBy: user,
        entity: updatedEnvironment,
        type: EventType.ENVIRONMENT_UPDATED,
        source: EventSource.ENVIRONMENT,
        title: `Environment updated`,
        metadata: {
          environmentId: updatedEnvironment.id,
          name: updatedEnvironment.name,
          projectId: updatedEnvironment.projectId
        },
        workspaceId: project.workspaceId
      },
      this.prisma
    )

    this.logger.log(
      `Environment ${updatedEnvironment.name} updated in project ${project.name} (${project.id})`
    )

    return updatedEnvironment
  }

  async getEnvironment(user: User, environmentId: Environment['id']) {
    const environment =
      await this.authorityCheckerService.checkAuthorityOverEnvironment({
        userId: user.id,
        entity: { id: environmentId },
        authority: Authority.READ_ENVIRONMENT,
        prisma: this.prisma
      })

    delete environment.project

    return environment
  }

  async getEnvironmentsOfProject(
    user: User,
    projectId: Project['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    await this.authorityCheckerService.checkAuthorityOverProject({
      userId: user.id,
      entity: { id: projectId },
      authority: Authority.READ_ENVIRONMENT,
      prisma: this.prisma
    })

    // Get the environments for the required page
    const items = await this.prisma.environment.findMany({
      where: {
        projectId,
        name: {
          contains: search
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        lastUpdatedBy: {
          select: {
            id: true,
            email: true,
            profilePictureUrl: true,
            name: true
          }
        }
      },
      skip: page * limit,
      take: limitMaxItemsPerPage(limit),
      orderBy: {
        [sort]: order
      }
    })
    // Calculate metadata for pagination
    const totalCount = await this.prisma.environment.count({
      where: {
        projectId,
        name: {
          contains: search
        }
      }
    })
    const metadata = paginate(totalCount, `/environment/all/${projectId}`, {
      page: page,
      limit: limitMaxItemsPerPage(limit),
      sort,
      order,
      search
    })

    return { items, metadata }
  }

  async deleteEnvironment(user: User, environmentId: Environment['id']) {
    const environment =
      await this.authorityCheckerService.checkAuthorityOverEnvironment({
        userId: user.id,
        entity: { id: environmentId },
        authority: Authority.DELETE_ENVIRONMENT,
        prisma: this.prisma
      })

    // Check if this is the only existing environment
    const count = await this.prisma.environment.count({
      where: {
        projectId: environment.projectId
      }
    })
    if (count === 1) {
      throw new BadRequestException(
        'Cannot delete the last environment in the project'
      )
    }

    // Delete the environment
    await this.prisma.environment.delete({
      where: {
        id: environment.id
      }
    })

    await createEvent(
      {
        triggeredBy: user,
        type: EventType.ENVIRONMENT_DELETED,
        source: EventSource.ENVIRONMENT,
        entity: environment,
        title: `Environment deleted`,
        metadata: {
          environmentId: environment.id,
          name: environment.name,
          projectId: environment.projectId
        },
        workspaceId: environment.project.workspaceId
      },
      this.prisma
    )

    this.logger.log(
      `Environment ${environment.name} deleted in project ${environment.project.name} (${environment.project.id})`
    )
  }

  private async environmentExists(
    name: Environment['name'],
    projectId: Project['id']
  ) {
    if (
      (await this.prisma.environment.findUnique({
        where: {
          projectId_name: {
            projectId,
            name
          }
        }
      })) !== null
    ) {
      throw new ConflictException(
        `Environment with name ${name} already exists in project ${projectId}`
      )
    }
  }
}
