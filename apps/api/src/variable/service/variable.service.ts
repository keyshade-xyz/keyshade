import {
  ConflictException,
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
  User,
  Variable,
  VariableVersion
} from '@prisma/client'
import { CreateVariable } from '../dto/create.variable/create.variable'
import { UpdateVariable } from '../dto/update.variable/update.variable'
import { RedisClientType } from 'redis'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { CHANGE_NOTIFIER_RSC } from '@/socket/change-notifier.socket'
import { AuthorizationService } from '@/auth/service/authorization.service'
import {
  ChangeNotification,
  ChangeNotificationEvent
} from '@/socket/socket.types'
import { paginate } from '@/common/paginate'
import { getEnvironmentIdToSlugMap } from '@/common/environment'
import generateEntitySlug from '@/common/slug-generator'
import { createEvent } from '@/common/event'
import { constructErrorBody, limitMaxItemsPerPage } from '@/common/util'
import { getVariableWithValues } from '@/common/variable'
import { AuthenticatedUser } from '@/user/user.types'
import { VariableWithValues } from '../variable.types'
import { TierLimitService } from '@/common/tier-limit.service'

@Injectable()
export class VariableService {
  private readonly logger = new Logger(VariableService.name)
  private readonly redis: RedisClientType

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly tierLimitService: TierLimitService,
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
  ): Promise<VariableWithValues> {
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
        entity: { slug: projectSlug },
        authorities: [Authority.CREATE_VARIABLE]
      })
    const projectId = project.id

    // Check if more variables are allowed in the project
    await this.tierLimitService.checkVariableLimitReached(project)

    // Check if a variable with the same name already exists in the project
    await this.variableExists(dto.name, project)

    const shouldCreateRevisions = dto.entries && dto.entries.length > 0
    this.logger.log(
      `${dto.entries?.length || 0} revisions set for variable. Revision creation for variable ${dto.name} is set to ${shouldCreateRevisions}`
    )

    // Check if the user has access to the environments
    const environmentSlugToIdMap = shouldCreateRevisions
      ? await getEnvironmentIdToSlugMap(
          dto,
          user,
          project,
          this.authorizationService
        )
      : new Map<string, string>()

    // Create the variable
    this.logger.log(`Creating variable ${dto.name} in project ${project.slug}`)
    const variableData = await this.prisma.variable.create({
      data: {
        name: dto.name,
        slug: await generateEntitySlug(dto.name, 'VARIABLE', this.prisma),
        note: dto.note,
        versions: shouldCreateRevisions && {
          createMany: {
            data: dto.entries.map((entry) => ({
              value: entry.value,
              createdById: user.id,
              environmentId: environmentSlugToIdMap.get(entry.environmentSlug)
            }))
          }
        },
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
            name: true
          }
        },
        versions: {
          select: {
            environment: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            version: true,
            value: true
          }
        }
      }
    })

    this.logger.log(
      `Created variable ${variableData.name} in project ${project.slug}`
    )

    const variable = getVariableWithValues(variableData)

    await createEvent(
      {
        triggeredBy: user,
        entity: variable.variable,
        type: EventType.VARIABLE_ADDED,
        source: EventSource.VARIABLE,
        title: `Variable created`,
        metadata: {
          variableId: variable.variable.id,
          name: variable.variable.name,
          projectId,
          projectName: project.name
        },
        workspaceId: project.workspaceId
      },
      this.prisma
    )

    return variable
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
  ) {
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
        entity: { slug: variableSlug },
        authorities: [Authority.UPDATE_VARIABLE]
      })

    // Check if the variable already exists in the project
    dto.name && (await this.variableExists(dto.name, variable.project))

    const shouldCreateRevisions = dto.entries && dto.entries.length > 0
    this.logger.log(
      `${dto.entries?.length || 0} revisions set for variable. Revision creation for variable ${dto.name} is set to ${shouldCreateRevisions}`
    )

    // Check if the user has access to the environments
    const environmentSlugToIdMap = shouldCreateRevisions
      ? await getEnvironmentIdToSlugMap(
          dto,
          user,
          variable.project,
          this.authorizationService
        )
      : new Map<string, string>()

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
          slug: dto.name
            ? await generateEntitySlug(dto.name, 'VARIABLE', this.prisma)
            : undefined,
          note: dto.note,
          lastUpdatedById: user.id
        },
        select: {
          id: true,
          name: true,
          note: true,
          slug: true
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
            },
            select: {
              id: true,
              environment: {
                select: {
                  id: true,
                  slug: true
                }
              },
              value: true,
              version: true
            }
          })
        )
      }
    }

    // Make the transaction
    const tx = await this.prisma.$transaction(op)
    const updatedVariable = tx[0]
    const updatedVersions = tx.slice(1)

    const result = {
      variable: updatedVariable,
      updatedVersions: updatedVersions
    }

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
          variableId: variable.id,
          name: variable.name,
          projectId: variable.projectId,
          projectName: variable.project.name
        },
        workspaceId: variable.project.workspaceId
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} updated variable ${variable.id}`)

    return result
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

    // Fetch the variable
    this.logger.log(
      `Checking if user has permissions to rollback variable ${variableSlug} in environment ${environmentSlug}`
    )
    const environment =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        entity: { slug: environmentSlug },
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
        entity: { slug: variableSlug },
        authorities: [Authority.UPDATE_VARIABLE]
      })

    // Filter the variable versions by the environment
    this.logger.log(
      `Filtering variable versions of variable ${variableSlug} in environment ${environmentSlug}`
    )
    variable.versions = variable.versions.filter(
      (version) => version.environmentId === environmentId
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

    // Sorting is in ascending order of dates. So the last element is the latest version
    const maxVersion = variable.versions[variable.versions.length - 1].version
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
          value: variable.versions[rollbackVersion - 1].value,
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
          variableId: variable.id,
          name: variable.name,
          projectId: variable.projectId,
          projectName: variable.project.name,
          rollbackVersion
        },
        workspaceId: variable.project.workspaceId
      },
      this.prisma
    )

    return result
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
        entity: { slug: variableSlug },
        authorities: [Authority.DELETE_VARIABLE]
      })

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
          variableId: variable.id,
          name: variable.name,
          projectId: variable.projectId,
          projectName: variable.project.name
        },
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
  ) {
    this.logger.log(
      `User ${user.id} attempted to get all variables of project ${projectSlug}`
    )

    // Check if the user has the required authorities in the project
    this.logger.log(
      `Checking if user has permissions to get all variables of project ${projectSlug}`
    )
    const { id: projectId } =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        entity: { slug: projectSlug },
        authorities: [Authority.READ_VARIABLE]
      })

    this.logger.log(`Getting all variables of project ${projectSlug}`)
    const variables = await this.prisma.variable.findMany({
      where: {
        projectId,
        name: {
          contains: search
        }
      },
      include: {
        lastUpdatedBy: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true
          }
        },
        versions: {
          select: {
            value: true,
            version: true,
            environment: {
              select: {
                name: true,
                id: true,
                slug: true
              }
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                profilePictureUrl: true
              }
            },
            createdOn: true
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
      `Got all variables of project ${projectSlug}. Count: ${variables.length}`
    )

    const variablesWithEnvironmentalValues = new Set<{
      variable: Partial<Variable>
      values: {
        environment: {
          name: Environment['name']
          id: Environment['id']
          slug: Environment['slug']
        }
        value: VariableVersion['value']
        version: VariableVersion['version']
        createdBy: {
          id: User['id']
          name: User['name']
          profilePictureUrl: User['profilePictureUrl']
        }
        createdOn: VariableVersion['createdOn']
      }[]
    }>()

    for (const variable of variables) {
      // Logic to update the map:
      // 1. If the environment ID is not present in the key, insert the environment ID and the variable version
      // 2. If the environment ID is already present, check if the existing variable version is lesser than the new variable version.
      //    If it is, update the variable version
      const envIdToVariableVersionMap = new Map<
        Environment['id'],
        Partial<VariableVersion> & {
          environment: {
            id: Environment['id']
            slug: Environment['slug']
            name: Environment['name']
          }
          createdBy: {
            id: User['id']
            name: User['name']
            profilePictureUrl: User['profilePictureUrl']
          }
        }
      >()

      for (const variableVersion of variable.versions) {
        const environmentId = variableVersion.environment.id
        const existingVariableVersion =
          envIdToVariableVersionMap.get(environmentId)

        if (!existingVariableVersion) {
          envIdToVariableVersionMap.set(environmentId, variableVersion)
        } else {
          if (existingVariableVersion.version < variableVersion.version) {
            envIdToVariableVersionMap.set(environmentId, variableVersion)
          }
        }
      }

      delete variable.versions

      // Add the variable to the map
      variablesWithEnvironmentalValues.add({
        variable,
        values: await Promise.all(
          Array.from(envIdToVariableVersionMap.values()).map(
            async (variableVersion) => ({
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
            })
          )
        )
      })
    }

    const items = Array.from(variablesWithEnvironmentalValues.values())

    //calculate metadata
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

    return { items, metadata }
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
  ) {
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
        entity: { slug: variableSlug },
        authorities: [Authority.READ_VARIABLE]
      })

    // Check access to the environment
    this.logger.log(
      `Checking if user has permissions to access environment ${environmentSlug}`
    )
    const { id: environmentId } =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        entity: { slug: environmentSlug },
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
  ) {
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
        entity: { slug: projectSlug },
        authorities: [Authority.READ_VARIABLE]
      })

    // Check if the user has the required authorities in the environment
    this.logger.log(
      `Checking if user has permissions to access environment ${environmentSlug}`
    )
    const { id: environmentId } =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        entity: { slug: environmentSlug },
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

    return variables.map(
      (variable) =>
        ({
          name: variable.name,
          value: variable.versions[0].value,
          isPlaintext: true
        }) as ChangeNotification
    )
  }

  /**
   * Checks if a variable with a given name already exists in a project.
   * Throws a ConflictException if the variable already exists.
   * @param variableName the name of the variable to check for
   * @param project the project to check in
   * @returns nothing
   * @throws `ConflictException` if the variable already exists
   */
  private async variableExists(
    variableName: Variable['name'],
    project: Project
  ) {
    this.logger.log(
      `Checking if variable ${variableName} already exists in project ${project.slug}`
    )

    if (
      (await this.prisma.variable.findFirst({
        where: {
          name: variableName,
          projectId: project.id
        }
      })) !== null
    ) {
      const errorMessage = `Variable ${variableName} already exists in project ${project.slug}`
      this.logger.error(errorMessage)
      throw new ConflictException(
        constructErrorBody('Variable already exists', errorMessage)
      )
    }

    this.logger.log(
      `Variable ${variableName} does not exist in project ${project.slug}`
    )
  }
}
