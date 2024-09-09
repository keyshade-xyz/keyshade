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
import { PrismaService } from '@/prisma/prisma.service'
import { AuthorityCheckerService } from '@/common/authority-checker.service'
import { paginate } from '@/common/paginate'
import generateEntitySlug from '@/common/slug-generator'
import { createEvent } from '@/common/event'
import { limitMaxItemsPerPage } from '@/common/util'

@Injectable()
export class EnvironmentService {
  private readonly logger = new Logger(EnvironmentService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityCheckerService: AuthorityCheckerService
  ) {}

  /**
   * Creates a new environment in the given project.
   *
   * This endpoint requires the following authorities:
   * - `CREATE_ENVIRONMENT` on the project
   * - `READ_ENVIRONMENT` on the project
   * - `READ_PROJECT` on the project
   *
   * If the user does not have the required authorities, a `ForbiddenException` is thrown.
   *
   * If an environment with the same name already exists in the project, a `ConflictException` is thrown.
   *
   * The created environment is returned, with the slug generated using the `name` and `ENVIRONMENT` as the entity type.
   *
   * An event of type `ENVIRONMENT_ADDED` is created, with the following metadata:
   * - `environmentId`: The ID of the created environment
   * - `name`: The name of the created environment
   * - `projectId`: The ID of the project in which the environment was created
   * - `projectName`: The name of the project in which the environment was created
   *
   * @param user The user that is creating the environment
   * @param dto The data for the new environment
   * @param projectSlug The slug of the project in which to create the environment
   * @returns The created environment
   */
  async createEnvironment(
    user: User,
    dto: CreateEnvironment,
    projectSlug: Project['slug']
  ) {
    // Check if the user has the required role to create an environment
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: projectSlug },
        authorities: [
          Authority.CREATE_ENVIRONMENT,
          Authority.READ_ENVIRONMENT,
          Authority.READ_PROJECT
        ],
        prisma: this.prisma
      })
    const projectId = project.id

    // Check if an environment with the same name already exists
    await this.environmentExists(dto.name, project)

    // Create the environment
    const environment = await this.prisma.environment.create({
      data: {
        name: dto.name,
        slug: await generateEntitySlug(dto.name, 'ENVIRONMENT', this.prisma),
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

  /**
   * Updates an environment in the given project.
   *
   * This endpoint requires the following authorities:
   * - `UPDATE_ENVIRONMENT` on the environment
   * - `READ_ENVIRONMENT` on the environment
   * - `READ_PROJECT` on the project
   *
   * If the user does not have the required authorities, a `ForbiddenException` is thrown.
   *
   * If an environment with the same name already exists in the project, a `ConflictException` is thrown.
   *
   * The updated environment is returned, with the slug generated using the `name` and `ENVIRONMENT` as the entity type.
   *
   * An event of type `ENVIRONMENT_UPDATED` is created, with the following metadata:
   * - `environmentId`: The ID of the updated environment
   * - `name`: The name of the updated environment
   * - `projectId`: The ID of the project in which the environment was updated
   * - `projectName`: The name of the project in which the environment was updated
   *
   * @param user The user that is updating the environment
   * @param dto The data for the updated environment
   * @param environmentSlug The slug of the environment to update
   * @returns The updated environment
   */
  async updateEnvironment(
    user: User,
    dto: UpdateEnvironment,
    environmentSlug: Environment['slug']
  ) {
    const environment =
      await this.authorityCheckerService.checkAuthorityOverEnvironment({
        userId: user.id,
        entity: { slug: environmentSlug },
        authorities: [
          Authority.UPDATE_ENVIRONMENT,
          Authority.READ_ENVIRONMENT,
          Authority.READ_PROJECT
        ],
        prisma: this.prisma
      })

    // Check if an environment with the same name already exists
    dto.name && (await this.environmentExists(dto.name, environment.project))

    // Update the environment
    const updatedEnvironment = await this.prisma.environment.update({
      where: {
        id: environment.id
      },
      data: {
        name: dto.name,
        slug: dto.name
          ? await generateEntitySlug(dto.name, 'ENVIRONMENT', this.prisma)
          : environment.slug,
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

  /**
   * Gets an environment by its slug.
   *
   * This endpoint requires the `READ_ENVIRONMENT` authority on the environment.
   *
   * If the user does not have the required authority, a `ForbiddenException` is thrown.
   *
   * The returned environment object does not include the project property.
   *
   * @param user The user that is requesting the environment
   * @param environmentSlug The slug of the environment to get
   * @returns The environment
   */
  async getEnvironment(user: User, environmentSlug: Environment['slug']) {
    const environment =
      await this.authorityCheckerService.checkAuthorityOverEnvironment({
        userId: user.id,
        entity: { slug: environmentSlug },
        authorities: [Authority.READ_ENVIRONMENT],
        prisma: this.prisma
      })

    delete environment.project

    return environment
  }

  /**
   * Gets a list of all environments in the given project.
   *
   * This endpoint requires the `READ_ENVIRONMENT` authority on the project.
   *
   * If the user does not have the required authority, a `ForbiddenException` is thrown.
   *
   * The returned list of environments is paginated and sorted according to the provided parameters.
   *
   * The metadata object contains the following properties:
   * - `href`: The URL to the current page
   * - `next`: The URL to the next page (if it exists)
   * - `prev`: The URL to the previous page (if it exists)
   * - `totalPages`: The total number of pages
   * - `totalItems`: The total number of items
   * - `limit`: The maximum number of items per page
   * - `page`: The current page number
   * - `sort`: The sort field
   * - `order`: The sort order
   * - `search`: The search query
   *
   * @param user The user that is requesting the environments
   * @param projectSlug The slug of the project in which to get the environments
   * @param page The page number
   * @param limit The maximum number of items per page
   * @param sort The sort field
   * @param order The sort order
   * @param search The search query
   * @returns An object with a list of environments and metadata
   */
  async getEnvironmentsOfProject(
    user: User,
    projectSlug: Project['slug'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: projectSlug },
        authorities: [Authority.READ_ENVIRONMENT],
        prisma: this.prisma
      })
    const projectId = project.id

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
        slug: true,
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
    const metadata = paginate(totalCount, `/environment/all/${projectSlug}`, {
      page,
      limit: limitMaxItemsPerPage(limit),
      sort,
      order,
      search
    })

    return { items, metadata }
  }

  /**
   * Deletes an environment in a project.
   *
   * This endpoint requires the `DELETE_ENVIRONMENT` authority on the environment.
   *
   * If the user does not have the required authority, a `ForbiddenException` is thrown.
   *
   * If this is the only existing environment in the project, a `BadRequestException` is thrown.
   *
   * An event of type `ENVIRONMENT_DELETED` is created, with the following metadata:
   * - `environmentId`: The ID of the deleted environment
   * - `name`: The name of the deleted environment
   * - `projectId`: The ID of the project in which the environment was deleted
   *
   * @param user The user that is deleting the environment
   * @param environmentSlug The slug of the environment to delete
   */
  async deleteEnvironment(user: User, environmentSlug: Environment['slug']) {
    const environment =
      await this.authorityCheckerService.checkAuthorityOverEnvironment({
        userId: user.id,
        entity: { slug: environmentSlug },
        authorities: [Authority.DELETE_ENVIRONMENT],
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

  /**
   * Checks if an environment with the given name already exists in the given project.
   * @throws ConflictException if an environment with the given name already exists
   * @private
   */
  private async environmentExists(name: Environment['name'], project: Project) {
    const { id: projectId, slug } = project

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
        `Environment with name ${name} already exists in project ${slug}`
      )
    }
  }
}
