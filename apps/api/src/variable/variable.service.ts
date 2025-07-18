import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import {
  Authority,
  Environment,
  EventSource,
  EventType,
  Project,
  Variable,
  VariableVersion
} from '@prisma/client'
import { CreateVariable } from './dto/create.variable/create.variable'
import { UpdateVariable } from './dto/update.variable/update.variable'
import { RedisClientType } from 'redis'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { CHANGE_NOTIFIER_RSC } from '@/socket/change-notifier.socket'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { Configuration, ChangeNotificationEvent } from '@/socket/socket.types'
import { paginate, PaginatedResponse } from '@/common/paginate'
import { getEnvironmentIdToSlugMap } from '@/common/environment'
import { createEvent } from '@/common/event'
import {
  constructErrorBody,
  limitMaxItemsPerPage,
  mapEntriesToEventMetadata
} from '@/common/util'
import { AuthenticatedUser } from '@/user/user.types'
import {
  HydratedVariable,
  RawEntitledVariable,
  VariableRevision
} from './variable.types'
import { TierLimitService } from '@/common/tier-limit.service'
import SlugGenerator from '@/common/slug-generator.service'
import {
  ConfigurationAddedEventMetadata,
  ConfigurationDeletedEventMetadata,
  ConfigurationUpdatedEventMetadata
} from '@/event/event.types'
import { SecretService } from '@/secret/secret.service'
import { EntitlementService } from '@/common/entitlement.service'
import { InclusionQuery } from '@/common/inclusion-query'

@Injectable()
export class VariableService {
  private readonly logger = new Logger(VariableService.name)
  private readonly redis: RedisClientType

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly tierLimitService: TierLimitService,
    private readonly slugGenerator: SlugGenerator,
    private readonly entitlementService: EntitlementService,
    @Inject(forwardRef(() => SecretService))
    private readonly secretService: SecretService,
    @Inject(REDIS_CLIENT)
    readonly redisClient: {
      publisher: RedisClientType
    }
  ) {
    this.redis = redisClient.publisher
  }

  /**
   * Creates a new variable in a project
   * @param user the user performing the action
   * @param dto the variable to create
   * @param projectSlug the slug of the project to create the variable in
   * @returns the newly created variable
   */
  async createVariable(
    user: AuthenticatedUser,
    dto: CreateVariable,
    projectSlug: Project['slug']
  ): Promise<HydratedVariable> {
    this.logger.log(
      `User ${user.id} attempted to create variable ${dto.name} in project ${projectSlug}`
    )

    // Fetch the project
    this.logger.log(
      `Checking if user ${user.id} has access to create variable in project ${projectSlug}`
    )
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        slug: projectSlug,
        authorities: [Authority.CREATE_VARIABLE]
      })
    const projectId = project.id

    // Check if more variables are allowed in the project
    await this.tierLimitService.checkVariableLimitReached(project)

    // Check if a variable with the same name already exists in the project
    await this.variableExists(dto.name, project.id)

    // Check if a secret with the same name already exists in the project
    await this.secretService.secretExists(dto.name, project.id)

    const shouldCreateRevisions = dto.entries && dto.entries.length > 0
    this.logger.log(
      `${dto.entries?.length || 0} revisions set for variable. Revision creation for variable ${dto.name} is set to ${shouldCreateRevisions}`
    )

    // Check if the user has access to the environments
    const environmentSlugToIdMap = await getEnvironmentIdToSlugMap(
      dto,
      user,
      project,
      this.authorizationService,
      shouldCreateRevisions
    )

    // Create the variable
    this.logger.log(`Creating variable ${dto.name} in project ${project.slug}`)
    const variableData = await this.prisma.variable.create({
      data: {
        name: dto.name,
        slug: await this.slugGenerator.generateEntitySlug(dto.name, 'VARIABLE'),
        note: dto.note,
        versions: shouldCreateRevisions
          ? {
              createMany: {
                data: dto.entries.map((entry) => ({
                  value: entry.value,
                  createdById: user.id,
                  environmentId: environmentSlugToIdMap.get(
                    entry.environmentSlug
                  )
                }))
              }
            }
          : undefined,
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
      include: InclusionQuery.Variable
    })

    this.logger.log(
      `Created variable ${variableData.name} in project ${project.slug}`
    )

    const rawEntitledVariable = await this.entitlementService.entitleVariable({
      project,
      user,
      variable: variableData
    })

    const hydratedVariable = await this.flattenVariableVersions(
      rawEntitledVariable,
      user
    )

    if (dto.entries && dto.entries.length > 0) {
      try {
        for (const { environmentSlug, value } of dto.entries) {
          this.logger.log(
            `Publishing variable creation to Redis for variable ${rawEntitledVariable.slug} in environment ${environmentSlug}`
          )
          await this.redis.publish(
            CHANGE_NOTIFIER_RSC,
            JSON.stringify({
              environmentId: environmentSlugToIdMap.get(environmentSlug),
              name: dto.name,
              value,
              isPlaintext: true
            } as ChangeNotificationEvent)
          )
          this.logger.log(
            `Published variable update to Redis for variable ${rawEntitledVariable.slug} in environment ${environmentSlug}`
          )
        }
      } catch (error) {
        this.logger.error(`Error publishing variable update to Redis: ${error}`)
      }
    }

    await createEvent(
      {
        triggeredBy: user,
        entity: hydratedVariable,
        type: EventType.VARIABLE_ADDED,
        source: EventSource.VARIABLE,
        title: `Variable created`,
        metadata: {
          name: rawEntitledVariable.name,
          description: rawEntitledVariable.note,
          values: mapEntriesToEventMetadata(dto.entries),
          isSecret: false,
          isPlaintext: true
        } as ConfigurationAddedEventMetadata,
        workspaceId: project.workspaceId
      },
      this.prisma
    )

    return hydratedVariable
  }

  async bulkCreateVariables(
    user: AuthenticatedUser,
    projectSlug: string,
    variables: CreateVariable[]
  ): Promise<{
    successful: HydratedVariable[]
    failed: Array<{ name: string; error: string }>
  }> {
    this.logger.log(
      `User ${user.id} started bulk creation of ${variables.length} variables in project ${projectSlug}`
    )

    const successful: HydratedVariable[] = []
    const failed: Array<{ name: string; error: string }> = []

    for (const variable of variables) {
      try {
        const result = await this.createVariable(user, variable, projectSlug)
        successful.push(result)
      } catch (error) {
        this.logger.error(
          `Failed to create variable "${variable.name}": ${error.message}`
        )
        failed.push({ name: variable.name, error: error.message })
      }
    }

    return { successful, failed }
  }

  /**
   * Updates a variable in a project
   * @param user the user performing the action
   * @param variableSlug the slug of the variable to update
   * @param dto the data to update the variable with
   * @returns the updated variable and its new versions
   */
  async updateVariable(
    user: AuthenticatedUser,
    variableSlug: Variable['slug'],
    dto: UpdateVariable
  ): Promise<HydratedVariable> {
    this.logger.log(
      `User ${user.id} attempted to update variable ${variableSlug}`
    )

    // Fetch the variable
    this.logger.log(
      `Checking if user ${user.id} has access to update variable ${variableSlug}`
    )
    const variable =
      await this.authorizationService.authorizeUserAccessToVariable({
        user,
        slug: variableSlug,
        authorities: [Authority.UPDATE_VARIABLE]
      })

    // Check if the variable already exists in the project
    await this.variableExists(dto.name, variable.projectId)

    // Check if a secret with the same name already exists in the project
    await this.secretService.secretExists(dto.name, variable.projectId)

    const shouldCreateRevisions = dto.entries && dto.entries.length > 0
    this.logger.log(
      `${dto.entries?.length || 0} revisions set for variable. Revision creation for variable ${dto.name} is set to ${shouldCreateRevisions}`
    )

    // Check if the user has access to the environments
    const environmentSlugToIdMap = await getEnvironmentIdToSlugMap(
      dto,
      user,
      variable.project,
      this.authorizationService,
      shouldCreateRevisions
    )

    const op = []

    // Update the variable

    // Update the fields
    op.push(
      this.prisma.variable.update({
        where: {
          id: variable.id
        },
        data: {
          name: dto.name,
          slug: await this.slugGenerator.generateEntitySlug(
            dto.name,
            'VARIABLE'
          ),
          note: dto.note,
          lastUpdatedById: user.id
        }
      })
    )

    // If new values for various environments are proposed,
    // we want to create new versions for those environments
    if (shouldCreateRevisions) {
      for (const entry of dto.entries) {
        // Fetch the latest version of the variable for the environment
        this.logger.log(
          `Fetching latest version of variable ${variableSlug} for environment ${entry.environmentSlug}`
        )
        const latestVersion = await this.prisma.variableVersion.findFirst({
          where: {
            variableId: variable.id,
            environmentId: environmentSlugToIdMap.get(entry.environmentSlug)
          },
          select: {
            version: true
          },
          orderBy: {
            version: 'desc'
          },
          take: 1
        })
        this.logger.log(
          `Latest version of variable ${variableSlug} for environment ${entry.environmentSlug} is ${latestVersion?.version}`
        )

        // Create the new version
        op.push(
          this.prisma.variableVersion.create({
            data: {
              value: entry.value,
              version: latestVersion ? latestVersion.version + 1 : 1,
              createdById: user.id,
              environmentId: environmentSlugToIdMap.get(entry.environmentSlug),
              variableId: variable.id
            }
          })
        )
      }
    }

    // Make the transaction
    await this.prisma.$transaction(op)

    const updatedVariable = await this.prisma.variable.findUnique({
      where: {
        id: variable.id
      },
      include: InclusionQuery.Variable
    })

    const hydratedVariable = await this.flattenVariableVersions(
      {
        ...updatedVariable,
        entitlements: variable.entitlements
      },
      user
    )

    // Notify the new variable version through Redis
    if (dto.entries && dto.entries.length > 0) {
      for (const entry of dto.entries) {
        try {
          this.logger.log(
            `Publishing variable update to Redis for variable ${updatedVariable.slug} in environment ${entry.environmentSlug}`
          )
          await this.redis.publish(
            CHANGE_NOTIFIER_RSC,
            JSON.stringify({
              environmentId: environmentSlugToIdMap.get(entry.environmentSlug),
              name: updatedVariable.name,
              value: entry.value,
              isPlaintext: true
            } as ChangeNotificationEvent)
          )
          this.logger.log(
            `Published variable update to Redis for variable ${updatedVariable.slug} in environment ${entry.environmentSlug}`
          )
        } catch (error) {
          this.logger.error(
            `Error publishing variable update to Redis: ${error}`
          )
        }
      }
    }

    await createEvent(
      {
        triggeredBy: user,
        entity: variable,
        type: EventType.VARIABLE_UPDATED,
        source: EventSource.VARIABLE,
        title: `Variable updated`,
        metadata: {
          oldName: variable.name,
          newName: updatedVariable.name,
          description: updatedVariable.note,
          values: mapEntriesToEventMetadata(dto.entries),
          isPlaintext: true,
          isSecret: false
        } as ConfigurationUpdatedEventMetadata,
        workspaceId: variable.project.workspaceId
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} updated variable ${variable.id}`)

    return hydratedVariable
  }

  /**
   * Deletes the value of a variable for a specified environment.
   *
   * This method checks if the user has the necessary permissions to delete
   * the environment-specific value of a variable. Upon successful deletion,
   * an event of type `VARIABLE_UPDATED` is created with relevant metadata.
   *
   * @param user - The user performing the action
   * @param variableSlug - The slug of the variable whose environment value is to be deleted
   * @param environmentSlug - The slug of the environment from which the variable value is to be deleted
   * @returns nothing
   * @throws `NotFoundException` if the variable or environment does not exist
   * @throws `ForbiddenException` if the user lacks the required authority
   */

  async deleteEnvironmentValueOfVariable(
    user: AuthenticatedUser,
    variableSlug: Variable['slug'],
    environmentSlug: Environment['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to delete environment value of variable ${variableSlug} in environment ${environmentSlug}`
    )

    // Fetch the environment
    this.logger.log(
      `Checking if user has permissions to delete environment value of variable ${variableSlug} in environment ${environmentSlug}`
    )
    const environment =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        slug: environmentSlug,
        authorities: [Authority.UPDATE_VARIABLE]
      })
    const environmentId = environment.id

    // Fetch the variable
    const variable =
      await this.authorizationService.authorizeUserAccessToVariable({
        user,
        slug: variableSlug,
        authorities: [Authority.UPDATE_VARIABLE]
      })

    // Delete the environment value of the variable
    this.logger.log(
      `Deleting environment value of variable ${variable.slug} in environment ${environment.slug}`
    )
    const count = await this.prisma.variableVersion.deleteMany({
      where: {
        variableId: variable.id,
        environmentId
      }
    })

    this.logger.log(
      `Deleted environment value of variable ${variable.slug} in environment ${environment.slug}. Deleted ${count.count} variable versions`
    )

    await createEvent(
      {
        triggeredBy: user,
        entity: variable,
        type: EventType.VARIABLE_DELETED,
        source: EventSource.VARIABLE,
        title: `Variable updated`,
        metadata: {
          name: variable.name,
          environments: [environmentSlug]
        } as ConfigurationDeletedEventMetadata,
        workspaceId: variable.project.workspaceId
      },
      this.prisma
    )
  }

  /**
   * Rollback a variable to a specific version in a given environment.
   *
   * Throws a NotFoundException if the variable does not exist or if the version is invalid.
   * @param user the user performing the action
   * @param variableSlug the slug of the variable to rollback
   * @param environmentSlug the slug of the environment to rollback in
   * @param rollbackVersion the version to rollback to
   * @returns the deleted variable versions
   */
  async rollbackVariable(
    user: AuthenticatedUser,
    variableSlug: Variable['slug'],
    environmentSlug: Environment['slug'],
    rollbackVersion: VariableVersion['version']
  ) {
    this.logger.log(
      `User ${user.id} attempted to rollback variable ${variableSlug} to version ${rollbackVersion}`
    )

    // Fetch the environment
    this.logger.log(
      `Checking if user has permissions to rollback variable ${variableSlug} in environment ${environmentSlug}`
    )
    const environment =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        slug: environmentSlug,
        authorities: [Authority.UPDATE_VARIABLE]
      })
    const environmentId = environment.id

    // Fetch the variable
    this.logger.log(
      `Checking if user has permissions to rollback variable ${variableSlug}`
    )
    const variable =
      await this.authorizationService.authorizeUserAccessToVariable({
        user,
        slug: variableSlug,
        authorities: [Authority.UPDATE_VARIABLE]
      })

    // Filter the variable versions by the environment
    this.logger.log(
      `Filtering variable versions of variable ${variableSlug} in environment ${environmentSlug}`
    )
    variable.versions = variable.versions.filter(
      (version) => version.environment.id === environmentId
    )
    this.logger.log(
      `Found ${variable.versions.length} versions for variable ${variableSlug} in environment ${environmentSlug}`
    )

    if (variable.versions.length === 0) {
      const errorMessage = `Variable ${variable} has no versions for environment ${environmentSlug}`
      this.logger.error(errorMessage)
      throw new NotFoundException(
        constructErrorBody('No versions found for environment', errorMessage)
      )
    }

    let maxVersion = 0
    for (const element of variable.versions) {
      if (element.version > maxVersion) {
        maxVersion = element.version
      }
    }
    this.logger.log(
      `Latest version of variable ${variableSlug} in environment ${environmentSlug} is ${maxVersion}`
    )

    // Check if the rollback version is valid
    if (rollbackVersion < 1 || rollbackVersion >= maxVersion) {
      const errorMessage = `Variable ${variableSlug} can not be rolled back to version ${rollbackVersion}`
      this.logger.error(errorMessage)
      throw new NotFoundException(
        constructErrorBody('Invalid rollback version', errorMessage)
      )
    }

    // Rollback the variable
    this.logger.log(
      `Rolling back variable ${variableSlug} to version ${rollbackVersion}`
    )
    const result = await this.prisma.variableVersion.deleteMany({
      where: {
        variableId: variable.id,
        version: {
          gt: Number(rollbackVersion)
        }
      }
    })
    this.logger.log(
      `Rolled back variable ${variableSlug} to version ${rollbackVersion}`
    )

    const variableValue = variable.versions[rollbackVersion - 1].value

    try {
      // Notify the new variable version through Redis
      this.logger.log(
        `Publishing variable update to Redis for variable ${variable.slug} in environment ${environment.slug}`
      )
      await this.redis.publish(
        CHANGE_NOTIFIER_RSC,
        JSON.stringify({
          environmentId,
          name: variable.name,
          value: variableValue,
          isPlaintext: true
        } as ChangeNotificationEvent)
      )
      this.logger.log(
        `Published variable update to Redis for variable ${variable.slug} in environment ${environment.slug}`
      )
    } catch (error) {
      this.logger.error(`Error publishing variable update to Redis: ${error}`)
    }

    await createEvent(
      {
        triggeredBy: user,
        entity: variable,
        type: EventType.VARIABLE_UPDATED,
        source: EventSource.VARIABLE,
        title: `Variable rolled back`,
        metadata: {
          newName: variable.name,
          oldName: variable.name,
          values: {
            [environment.slug]: variableValue
          },
          isPlaintext: true,
          isSecret: false
        } as ConfigurationUpdatedEventMetadata,
        workspaceId: variable.project.workspaceId
      },
      this.prisma
    )

    const currentRevision = variable.versions.find(
      (version) => version.version === rollbackVersion
    )!

    return {
      ...result,
      currentRevision
    }
  }

  /**
   * Deletes a variable from a project.
   * @param user the user performing the action
   * @param variableSlug the slug of the variable to delete
   * @returns nothing
   * @throws `NotFoundException` if the variable does not exist
   * @throws `ForbiddenException` if the user does not have the required authority
   */
  async deleteVariable(
    user: AuthenticatedUser,
    variableSlug: Variable['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to delete variable ${variableSlug}`
    )

    // Check if the user has the required role
    this.logger.log(
      `Checking if user has permissions to delete variable ${variableSlug}`
    )
    const variable =
      await this.authorizationService.authorizeUserAccessToVariable({
        user,
        slug: variableSlug,
        authorities: [Authority.DELETE_VARIABLE]
      })

    const variableVersionEnvironments = new Set<Environment['slug']>()
    for (const version of variable.versions) {
      variableVersionEnvironments.add(version.environment.slug)
    }

    // Delete the variable
    this.logger.log(`Deleting variable ${variable.slug}`)
    await this.prisma.variable.delete({
      where: {
        id: variable.id
      }
    })
    this.logger.log(`Deleted variable ${variable.slug}`)

    await createEvent(
      {
        triggeredBy: user,
        type: EventType.VARIABLE_DELETED,
        source: EventSource.VARIABLE,
        title: `Variable deleted`,
        entity: variable,
        metadata: {
          name: variable.name,
          environments: Array.from(variableVersionEnvironments)
        } as ConfigurationDeletedEventMetadata,
        workspaceId: variable.project.workspaceId
      },
      this.prisma
    )
  }

  /**
   * Gets all variables of a project, paginated, sorted and filtered by search query.
   * @param user the user performing the action
   * @param projectSlug the slug of the project to get the variables from
   * @param page the page number to fetch
   * @param limit the number of items per page
   * @param sort the field to sort by
   * @param order the order to sort in
   * @param search the search query to filter by
   * @returns a paginated list of variables with their latest versions for each environment
   * @throws `NotFoundException` if the project does not exist
   * @throws `ForbiddenException` if the user does not have the required authority
   */
  async getAllVariablesOfProject(
    user: AuthenticatedUser,
    projectSlug: Project['slug'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<PaginatedResponse<HydratedVariable>> {
    this.logger.log(
      `User ${user.id} attempted to get all variables of project ${projectSlug}`
    )

    // Check if the user has the required authorities in the project
    this.logger.log(
      `Checking if user has permissions to get all variables of project ${projectSlug}`
    )
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        slug: projectSlug,
        authorities: [Authority.READ_VARIABLE]
      })
    const projectId = project.id

    this.logger.log(
      `Fetching all variables of project ${projectSlug} with search query ${search}`
    )
    const variables = await this.prisma.variable.findMany({
      where: {
        projectId,
        name: {
          contains: search
        }
      },
      include: InclusionQuery.Variable,
      skip: page * limit,
      take: limitMaxItemsPerPage(limit),
      orderBy: {
        [sort]: order
      }
    })
    this.logger.log(
      `Fetched ${variables.length} variables of project ${projectSlug}`
    )

    const hydratedVariables: HydratedVariable[] = []

    for (const variable of variables) {
      delete variable.project

      const rawEntitledVariable = await this.entitlementService.entitleVariable(
        {
          project,
          user,
          variable
        }
      )

      const hydratedVariable = await this.flattenVariableVersions(
        rawEntitledVariable,
        user
      )

      hydratedVariables.push(hydratedVariable)
    }
    this.logger.log(
      `Hydrated ${hydratedVariables.length} variables of project ${projectSlug}`
    )

    // Calculate pagination metadata
    const totalCount = await this.prisma.variable.count({
      where: {
        projectId,
        name: {
          contains: search
        }
      }
    })

    const metadata = paginate(totalCount, `/variable/${projectSlug}`, {
      page,
      limit: limitMaxItemsPerPage(limit),
      sort,
      order,
      search
    })

    return { items: hydratedVariables, metadata }
  }

  /**
   * Gets all revisions of a variable in a given environment.
   *
   * The response is paginated and sorted by the version in the given order.
   * @param user the user performing the action
   * @param variableSlug the slug of the variable
   * @param environmentSlug the slug of the environment
   * @param page the page number to fetch
   * @param limit the number of items per page
   * @param order the order to sort in
   * @returns a paginated list of variable versions with metadata
   * @throws `NotFoundException` if the variable or environment does not exist
   * @throws `ForbiddenException` if the user does not have the required authority
   */
  async getRevisionsOfVariable(
    user: AuthenticatedUser,
    variableSlug: Variable['slug'],
    environmentSlug: Environment['slug'],
    page: number,
    limit: number,
    order: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResponse<VariableRevision>> {
    this.logger.log(
      `User ${user.id} attempted to get revisions of variable ${variableSlug} in environment ${environmentSlug}`
    )

    // Fetch the variable
    this.logger.log(
      `Checking if user has permissions to access variable ${variableSlug}`
    )
    const { id: variableId } =
      await this.authorizationService.authorizeUserAccessToVariable({
        user,
        slug: variableSlug,
        authorities: [Authority.READ_VARIABLE]
      })

    // Check access to the environment
    this.logger.log(
      `Checking if user has permissions to access environment ${environmentSlug}`
    )
    const { id: environmentId } =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        slug: environmentSlug,
        authorities: [Authority.READ_ENVIRONMENT]
      })

    // Fetch the variable versions
    this.logger.log(
      `Fetching variable versions for variable ${variableSlug} in environment ${environmentSlug}`
    )
    const items = await this.prisma.variableVersion.findMany({
      where: {
        variableId: variableId,
        environmentId: environmentId
      },
      select: InclusionQuery.Variable['versions']['select'],
      skip: page * limit,
      take: limitMaxItemsPerPage(limit),
      orderBy: {
        version: order
      }
    })
    this.logger.log(
      `Fetched ${items.length} variable versions for variable ${variableSlug} in environment ${environmentSlug}`
    )

    const total = await this.prisma.variableVersion.count({
      where: {
        variableId: variableId,
        environmentId: environmentId
      }
    })

    const metadata = paginate(total, `/variable/${variableSlug}`, {
      page,
      limit: limitMaxItemsPerPage(limit),
      order
    })

    return { items, metadata }
  }

  /**
   * Gets all variables of a project and environment.
   * @param user the user performing the action
   * @param projectSlug the slug of the project to get the variables from
   * @param environmentSlug the slug of the environment to get the variables from
   * @returns an array of objects containing the name, value and whether the value is a plaintext
   * @throws `NotFoundException` if the project or environment does not exist
   * @throws `ForbiddenException` if the user does not have the required authority
   */
  async getAllVariablesOfProjectAndEnvironment(
    user: AuthenticatedUser,
    projectSlug: Project['slug'],
    environmentSlug: Environment['slug']
  ): Promise<Configuration[]> {
    this.logger.log(
      `User ${user.id} attempted to get all variables of project ${projectSlug} and environment ${environmentSlug}`
    )

    // Check if the user has the required authorities in the project
    this.logger.log(
      `Checking if user has permissions to access project ${projectSlug}`
    )
    const { id: projectId } =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        slug: projectSlug,
        authorities: [Authority.READ_VARIABLE]
      })

    // Check if the user has the required authorities in the environment
    this.logger.log(
      `Checking if user has permissions to access environment ${environmentSlug}`
    )
    const { id: environmentId } =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        slug: environmentSlug,
        authorities: [Authority.READ_ENVIRONMENT]
      })

    // Fetch the variables
    this.logger.log(
      `Fetching variables for project ${projectSlug} and environment ${environmentSlug}`
    )
    const variables = await this.prisma.variable.findMany({
      where: {
        projectId,
        versions: {
          some: {
            environmentId
          }
        }
      },
      include: {
        lastUpdatedBy: {
          select: {
            id: true,
            name: true
          }
        },
        versions: {
          where: {
            environmentId
          },
          select: {
            value: true,
            environment: {
              select: {
                id: true,
                slug: true
              }
            }
          },
          orderBy: {
            version: 'desc'
          },
          take: 1
        }
      }
    })

    this.logger.log(
      `Fetched ${variables.length} variables for project ${projectSlug} and environment ${environmentSlug}`
    )

    return variables.map((variable) => ({
      name: variable.name,
      value: variable.versions[0].value,
      isPlaintext: true
    }))
  }

  /**
   * Checks if a variable with a given name already exists in a project.
   * Throws a ConflictException if the variable already exists.
   * @param variableName the name of the variable to check for
   * @param project the project to check in
   * @returns nothing
   * @throws `ConflictException` if the variable already exists
   */
  async variableExists(
    variableName: Variable['name'] | null | undefined,
    projectId: Project['id']
  ) {
    if (!variableName) return

    this.logger.log(
      `Checking if variable ${variableName} already exists in project ${projectId}`
    )

    if (
      (await this.prisma.variable.findFirst({
        where: {
          name: variableName,
          projectId
        }
      })) !== null
    ) {
      const errorMessage = `Variable ${variableName} already exists in project ${projectId}`
      this.logger.error(errorMessage)
      throw new ConflictException(
        constructErrorBody('Variable already exists', errorMessage)
      )
    }

    this.logger.log(
      `Variable ${variableName} does not exist in project ${projectId}`
    )
  }

  private async flattenVariableVersions(
    rawEntitledVariable: RawEntitledVariable,
    user: AuthenticatedUser
  ): Promise<HydratedVariable> {
    // Logic to update the map:
    // 1. If the environment ID is not present in the key, insert the environment ID and the variable version
    // 2. If the environment ID is already present, check if the existing variable version is lesser than the new variable version.
    //    If it is, update the variable version
    const envIdToVariableVersionMap = new Map<
      Environment['id'],
      VariableRevision
    >()

    // Maintain a list of environments that the user is and is not allowed to access
    const environmentAccessibilityMap: Map<Environment['id'], boolean> =
      new Map()

    for (const variableVersion of rawEntitledVariable.versions) {
      const environmentSlug = variableVersion.environment.slug

      if (!environmentAccessibilityMap.has(variableVersion.environment.id)) {
        try {
          await this.authorizationService.authorizeUserAccessToEnvironment({
            user,
            slug: environmentSlug,
            authorities: [Authority.READ_ENVIRONMENT]
          })
          environmentAccessibilityMap.set(variableVersion.environment.id, true)
        } catch (error) {
          environmentAccessibilityMap.set(variableVersion.environment.id, false)
        }
      }

      if (!environmentAccessibilityMap.get(variableVersion.environment.id)) {
        continue
      }

      const environmentId = variableVersion.environment.id
      const existingVariableVersion =
        envIdToVariableVersionMap.get(environmentId)

      if (
        !existingVariableVersion ||
        existingVariableVersion.version < variableVersion.version
      ) {
        envIdToVariableVersionMap.set(environmentId, variableVersion)
      }
    }

    rawEntitledVariable.versions = Array.from(
      envIdToVariableVersionMap.values()
    ).map((variableVersion) => ({
      environment: {
        id: variableVersion.environment.id,
        name: variableVersion.environment.name,
        slug: variableVersion.environment.slug
      },
      value: variableVersion.value,
      version: variableVersion.version,
      createdBy: {
        id: variableVersion.createdBy.id,
        name: variableVersion.createdBy.name,
        profilePictureUrl: variableVersion.createdBy.profilePictureUrl
      },
      createdOn: variableVersion.createdOn
    }))

    return rawEntitledVariable
  }
}
