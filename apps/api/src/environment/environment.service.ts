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
  Project
} from '@prisma/client'
import { CreateEnvironment } from './dto/create.environment/create.environment'
import { UpdateEnvironment } from './dto/update.environment/update.environment'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { paginate } from '@/common/paginate'
import generateEntitySlug from '@/common/slug-generator'
import { createEvent } from '@/common/event'
import { constructErrorBody, limitMaxItemsPerPage } from '@/common/util'
import { AuthenticatedUser } from '@/user/user.types'
import { TierLimitService } from '@/common/tier-limit.service'

@Injectable()
export class EnvironmentService {
  private readonly logger = new Logger(EnvironmentService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly tierLimitService: TierLimitService
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
    user: AuthenticatedUser,
    dto: CreateEnvironment,
    projectSlug: Project['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to create environment ${dto.name} in project ${projectSlug}`
    )

    // Check if the user has the required role to create an environment
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        entity: { slug: projectSlug },
        authorities: [
          Authority.CREATE_ENVIRONMENT,
          Authority.READ_ENVIRONMENT,
          Authority.READ_PROJECT
        ]
      })
    const projectId = project.id

    // Check if more environments can be created in the project
    await this.tierLimitService.checkEnvironmentLimitReached(project)

    // Check if an environment with the same name already exists
    await this.environmentExists(dto.name, project)

    // Create the environment
    this.logger.log(
      `Creating environment ${dto.name} in project ${project.name}`
    )
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
      },
      include: {
        lastUpdatedBy: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
            email: true
          }
        }
      }
    })
    this.logger.log(
      `Environment ${environment.name} (${environment.slug}) created in project ${project.name}`
    )

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
    user: AuthenticatedUser,
    dto: UpdateEnvironment,
    environmentSlug: Environment['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to update environment ${environmentSlug}`
    )

    const environment =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        entity: { slug: environmentSlug },
        authorities: [
          Authority.UPDATE_ENVIRONMENT,
          Authority.READ_ENVIRONMENT,
          Authority.READ_PROJECT
        ]
      })

    // Check if an environment with the same name already exists
    dto.name && (await this.environmentExists(dto.name, environment.project))

    // Update the environment
    this.logger.log(`Updating environment ${environment.slug}`)
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
    this.logger.log(`Environment ${updatedEnvironment.slug} updated`)

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
  async getEnvironment(
    user: AuthenticatedUser,
    environmentSlug: Environment['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to fetch an environment ${environmentSlug}`
    )

    this.logger.log(`Fetching environment ${environmentSlug}`)
    const environment =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        entity: { slug: environmentSlug },
        authorities: [Authority.READ_ENVIRONMENT]
      })
    this.logger.log(`Environment ${environmentSlug} fetched`)

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
    user: AuthenticatedUser,
    projectSlug: Project['slug'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    this.logger.log(
      `User ${user.id} attempted to fetch environments of project ${projectSlug}`
    )

    this.logger.log(`Fetching project of environment ${projectSlug}`)
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        entity: { slug: projectSlug },
        authorities: [Authority.READ_ENVIRONMENT]
      })
    this.logger.log(`Project ${projectSlug} fetched`)
    const projectId = project.id

    // Get the environments for the required page
    this.logger.log(`Fetching environments of project ${projectSlug}`)
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
    this.logger.log(
      `Environments of project ${projectSlug} fetched. Count: ${items.length}`
    )

    // Parse the secret and variable counts for each environment
    for (const environment of items) {
      const secretCount = await this.getSecretCount(environment.id)
      const variableCount = await this.getVariableCount(environment.id)
      environment['secrets'] = secretCount
      environment['variables'] = variableCount
    }

    // Calculate metadata for pagination
    this.logger.log(
      `Calculating metadata for environments of project ${projectSlug}`
    )
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
    this.logger.log(
      `Metadata calculated for environments of project ${projectSlug}`
    )

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
  async deleteEnvironment(
    user: AuthenticatedUser,
    environmentSlug: Environment['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to delete environment ${environmentSlug}`
    )

    this.logger.log(`Fetching environment ${environmentSlug}`)
    const environment =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        entity: { slug: environmentSlug },
        authorities: [Authority.DELETE_ENVIRONMENT]
      })
    this.logger.log(`Environment ${environmentSlug} fetched`)

    // Check if this is the only existing environment
    this.logger.log(
      `Checking if environment ${environmentSlug} is the last one`
    )
    const count = await this.prisma.environment.count({
      where: {
        projectId: environment.projectId
      }
    })

    if (count === 1) {
      const errorMessage = `Environment ${environmentSlug} is the only environment in the project`
      this.logger.error(errorMessage)
      throw new BadRequestException(
        constructErrorBody('Last environment cannot be deleted', errorMessage)
      )
    } else {
      this.logger.log(`Environment ${environmentSlug} is not the last one`)
    }

    // Delete the environment
    this.logger.log(`Deleting environment ${environmentSlug}`)
    await this.prisma.environment.delete({
      where: {
        id: environment.id
      }
    })
    this.logger.log(`Environment ${environmentSlug} deleted`)

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
  }

  /**
   * Checks if an environment with the given name already exists in the given project.
   * @throws ConflictException if an environment with the given name already exists
   * @private
   */
  private async environmentExists(name: Environment['name'], project: Project) {
    this.logger.log(
      `Checking if environment ${name} exists in project ${project.slug}`
    )

    const { id: projectId, slug } = project

    if (
      (await this.prisma.environment.findUnique({
        where: {
          projectId_name: {
            projectId,
            name: name
          }
        }
      })) !== null
    ) {
      const errorMessage = `Environment with name ${name} already exists in project ${slug}`
      this.logger.error(errorMessage)
      throw new ConflictException(
        constructErrorBody('Environment exists', errorMessage)
      )
    }

    this.logger.log(`Environment ${name} does not exist in project ${slug}`)
  }

  /**
   * Counts the number of unique secrets in an environment.
   * @param environmentId The ID of the environment to count secrets for.
   * @returns The number of unique secrets in the environment.
   * @private
   */
  private async getSecretCount(
    environmentId: Environment['id']
  ): Promise<number> {
    this.logger.log(`Counting secrets in environment ${environmentId}`)

    const secrets = await this.prisma.secretVersion.findMany({
      distinct: ['secretId'],
      where: {
        environmentId
      }
    })

    const secretCount = secrets.length
    this.logger.log(
      `Found ${secretCount} secrets in environment ${environmentId}`
    )
    return secrets.length
  }

  /**
   * Counts the number of unique variables in an environment.
   * @param environmentId The ID of the environment to count variables for.
   * @returns The number of unique variables in the environment.
   * @private
   */
  private async getVariableCount(
    environmentId: Environment['id']
  ): Promise<number> {
    this.logger.log(`Counting variables in environment ${environmentId}`)

    const variables = await this.prisma.variableVersion.findMany({
      distinct: ['variableId'],
      where: {
        environmentId
      }
    })

    const variableCount = variables.length
    this.logger.log(
      `Found ${variableCount} variables in environment ${environmentId}`
    )
    return variableCount
  }
}
