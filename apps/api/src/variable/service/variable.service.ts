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
import { AuthorityCheckerService } from '@/common/authority-checker.service'
import {
  ChangeNotification,
  ChangeNotificationEvent
} from 'src/socket/socket.types'
import { paginate } from '@/common/paginate'
import { getEnvironmentIdToSlugMap } from '@/common/environment'
import generateEntitySlug from '@/common/slug-generator'
import { createEvent } from '@/common/event'
import { limitMaxItemsPerPage } from '@/common/util'

@Injectable()
export class VariableService {
  private readonly logger = new Logger(VariableService.name)
  private readonly redis: RedisClientType

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT)
    readonly redisClient: {
      publisher: RedisClientType
    },
    private readonly authorityCheckerService: AuthorityCheckerService
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
    user: User,
    dto: CreateVariable,
    projectSlug: Project['slug']
  ) {
    // Fetch the project
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: projectSlug },
        authorities: [Authority.CREATE_VARIABLE],
        prisma: this.prisma
      })
    const projectId = project.id

    // Check if a variable with the same name already exists in the project
    await this.variableExists(dto.name, project)

    const shouldCreateRevisions = dto.entries && dto.entries.length > 0

    // Check if the user has access to the environments
    const environmentSlugToIdMap = shouldCreateRevisions
      ? await getEnvironmentIdToSlugMap(
          dto,
          user,
          project,
          this.prisma,
          this.authorityCheckerService
        )
      : new Map<string, string>()

    // Create the variable
    const variable = await this.prisma.variable.create({
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
        project: {
          select: {
            workspaceId: true
          }
        },
        versions: {
          select: {
            environmentId: true,
            environment: {
              select: {
                id: true,
                slug: true
              }
            },
            value: true
          }
        }
      }
    })

    await createEvent(
      {
        triggeredBy: user,
        entity: variable,
        type: EventType.VARIABLE_ADDED,
        source: EventSource.VARIABLE,
        title: `Variable created`,
        metadata: {
          variableId: variable.id,
          name: variable.name,
          projectId,
          projectName: project.name
        },
        workspaceId: project.workspaceId
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} created variable ${variable.id}`)

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
    user: User,
    variableSlug: Variable['slug'],
    dto: UpdateVariable
  ) {
    const variable =
      await this.authorityCheckerService.checkAuthorityOverVariable({
        userId: user.id,
        entity: { slug: variableSlug },
        authorities: [Authority.UPDATE_VARIABLE],
        prisma: this.prisma
      })

    // Check if the variable already exists in the project
    dto.name && (await this.variableExists(dto.name, variable.project))

    const shouldCreateRevisions = dto.entries && dto.entries.length > 0

    // Check if the user has access to the environments
    const environmentSlugToIdMap = shouldCreateRevisions
      ? await getEnvironmentIdToSlugMap(
          dto,
          user,
          variable.project,
          this.prisma,
          this.authorityCheckerService
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
              environmentId: true,
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
          await this.redis.publish(
            CHANGE_NOTIFIER_RSC,
            JSON.stringify({
              environmentId: environmentSlugToIdMap.get(entry.environmentSlug),
              name: updatedVariable.name,
              value: entry.value,
              isPlaintext: true
            } as ChangeNotificationEvent)
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
    user: User,
    variableSlug: Variable['slug'],
    environmentSlug: Environment['slug'],
    rollbackVersion: VariableVersion['version']
  ) {
    const environment =
      await this.authorityCheckerService.checkAuthorityOverEnvironment({
        userId: user.id,
        entity: { slug: environmentSlug },
        authorities: [Authority.UPDATE_VARIABLE],
        prisma: this.prisma
      })
    const environmentId = environment.id

    const variable =
      await this.authorityCheckerService.checkAuthorityOverVariable({
        userId: user.id,
        entity: { slug: variableSlug },
        authorities: [Authority.UPDATE_VARIABLE],
        prisma: this.prisma
      })

    // Filter the variable versions by the environment
    variable.versions = variable.versions.filter(
      (version) => version.environmentId === environmentId
    )

    if (variable.versions.length === 0) {
      throw new NotFoundException(
        `No versions found for environment: ${environmentSlug} for variable: ${variableSlug}`
      )
    }

    // Sorting is in ascending order of dates. So the last element is the latest version
    const maxVersion = variable.versions[variable.versions.length - 1].version

    // Check if the rollback version is valid
    if (rollbackVersion < 1 || rollbackVersion >= maxVersion) {
      throw new NotFoundException(
        `Invalid rollback version: ${rollbackVersion} for variable: ${variableSlug}`
      )
    }

    // Rollback the variable
    const result = await this.prisma.variableVersion.deleteMany({
      where: {
        variableId: variable.id,
        version: {
          gt: Number(rollbackVersion)
        }
      }
    })

    try {
      // Notify the new variable version through Redis
      await this.redis.publish(
        CHANGE_NOTIFIER_RSC,
        JSON.stringify({
          environmentId,
          name: variable.name,
          value: variable.versions[rollbackVersion - 1].value,
          isPlaintext: true
        } as ChangeNotificationEvent)
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

    this.logger.log(`User ${user.id} rolled back variable ${variable.id}`)

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
  async deleteVariable(user: User, variableSlug: Variable['slug']) {
    const variable =
      await this.authorityCheckerService.checkAuthorityOverVariable({
        userId: user.id,
        entity: { slug: variableSlug },
        authorities: [Authority.DELETE_VARIABLE],
        prisma: this.prisma
      })

    // Delete the variable
    await this.prisma.variable.delete({
      where: {
        id: variable.id
      }
    })

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

    this.logger.log(`User ${user.id} deleted variable ${variable.id}`)
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
    user: User,
    projectSlug: Project['slug'],
    environmentSlug: Environment['slug']
  ) {
    // Check if the user has the required authorities in the project
    const { id: projectId } =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: projectSlug },
        authorities: [Authority.READ_VARIABLE],
        prisma: this.prisma
      })

    // Check if the user has the required authorities in the environment
    const { id: environmentId } =
      await this.authorityCheckerService.checkAuthorityOverEnvironment({
        userId: user.id,
        entity: { slug: environmentSlug },
        authorities: [Authority.READ_ENVIRONMENT],
        prisma: this.prisma
      })

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
            environmentId: true,
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
    user: User,
    projectSlug: Project['slug'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    // Check if the user has the required authorities in the project
    const { id: projectId } =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: projectSlug },
        authorities: [Authority.READ_VARIABLE],
        prisma: this.prisma
      })

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
            name: true
          }
        },
        versions: {
          select: {
            environmentId: true,
            environment: {
              select: {
                id: true,
                slug: true
              }
            }
          }
        }
      },
      skip: page * limit,
      take: limitMaxItemsPerPage(limit),
      orderBy: {
        [sort]: order
      }
    })

    const variablesWithEnvironmentalValues = new Map<
      Variable['id'],
      {
        variable: Variable
        values: {
          environment: {
            name: Environment['name']
            id: Environment['id']
            slug: Environment['slug']
          }
          value: VariableVersion['value']
          version: VariableVersion['version']
        }[]
      }
    >()

    // Find all the environments for this project
    const environments = await this.prisma.environment.findMany({
      where: {
        projectId
      }
    })
    const environmentIds = new Map(
      environments.map((env) => [env.id, env.name])
    )

    for (const variable of variables) {
      // Make a copy of the environment IDs
      const envIds = new Map(environmentIds)
      let iterations = envIds.size

      // Find the latest version for each environment
      while (iterations--) {
        const latestVersion = await this.prisma.variableVersion.findFirst({
          where: {
            variableId: variable.id,
            environmentId: {
              in: Array.from(envIds.keys())
            }
          },
          orderBy: {
            version: 'desc'
          },
          include: {
            environment: true
          }
        })

        if (!latestVersion) continue

        if (variablesWithEnvironmentalValues.has(variable.id)) {
          variablesWithEnvironmentalValues.get(variable.id).values.push({
            environment: {
              id: latestVersion.environmentId,
              name: envIds.get(latestVersion.environmentId),
              slug: latestVersion.environment.slug
            },
            value: latestVersion.value,
            version: latestVersion.version
          })
        } else {
          variablesWithEnvironmentalValues.set(variable.id, {
            variable,
            values: [
              {
                environment: {
                  id: latestVersion.environmentId,
                  name: envIds.get(latestVersion.environmentId),
                  slug: latestVersion.environment.slug
                },
                value: latestVersion.value,
                version: latestVersion.version
              }
            ]
          })
        }

        envIds.delete(latestVersion.environmentId)
      }
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
    user: User,
    variableSlug: Variable['slug'],
    environmentSlug: Environment['slug'],
    page: number,
    limit: number,
    order: 'asc' | 'desc' = 'desc'
  ) {
    const { id: variableId } =
      await this.authorityCheckerService.checkAuthorityOverVariable({
        userId: user.id,
        entity: { slug: variableSlug },
        authorities: [Authority.READ_VARIABLE],
        prisma: this.prisma
      })

    const { id: environmentId } =
      await this.authorityCheckerService.checkAuthorityOverEnvironment({
        userId: user.id,
        entity: { slug: environmentSlug },
        authorities: [Authority.READ_ENVIRONMENT],
        prisma: this.prisma
      })

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
    if (
      (await this.prisma.variable.findFirst({
        where: {
          name: variableName,
          projectId: project.id
        }
      })) !== null
    ) {
      throw new ConflictException(
        `Variable already exists: ${variableName} in project ${project.slug}`
      )
    }
  }
}
