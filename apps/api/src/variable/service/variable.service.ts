import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
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
import createEvent from '../../common/create-event'
import { UpdateVariable } from '../dto/update.variable/update.variable'
import { RedisClientType } from 'redis'
import { REDIS_CLIENT } from '../../provider/redis.provider'
import { CHANGE_NOTIFIER_RSC } from '../../socket/change-notifier.socket'
import { AuthorityCheckerService } from '../../common/authority-checker.service'
import {
  ChangeNotification,
  ChangeNotificationEvent
} from 'src/socket/socket.types'
import { paginate } from '../../common/paginate'
import { limitMaxItemsPerPage } from '../../common/limit-max-items-per-page'

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

  async createVariable(
    user: User,
    dto: CreateVariable,
    projectId: Project['id']
  ) {
    // Fetch the project
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: projectId },
        authority: Authority.CREATE_VARIABLE,
        prisma: this.prisma
      })

    // Check if a variable with the same name already exists in the project
    await this.variableExists(dto.name, projectId)

    const shouldCreateRevisions = dto.entries && dto.entries.length > 0

    // Check if the user has access to the environments
    if (shouldCreateRevisions) {
      const environmentIds = dto.entries.map((entry) => entry.environmentId)
      await Promise.all(
        environmentIds.map(async (environmentId) => {
          const environment =
            await this.authorityCheckerService.checkAuthorityOverEnvironment({
              userId: user.id,
              entity: { id: environmentId },
              authority: Authority.READ_ENVIRONMENT,
              prisma: this.prisma
            })

          // Check if the environment belongs to the project
          if (environment.projectId !== projectId) {
            throw new BadRequestException(
              `Environment: ${environmentId} does not belong to project: ${projectId}`
            )
          }
        })
      )
    }

    // Create the variable
    const variable = await this.prisma.variable.create({
      data: {
        name: dto.name,
        note: dto.note,
        versions: shouldCreateRevisions && {
          createMany: {
            data: dto.entries.map((entry) => ({
              value: entry.value,
              createdById: user.id,
              environmentId: entry.environmentId
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

  async updateVariable(
    user: User,
    variableId: Variable['id'],
    dto: UpdateVariable
  ) {
    const variable =
      await this.authorityCheckerService.checkAuthorityOverVariable({
        userId: user.id,
        entity: { id: variableId },
        authority: Authority.UPDATE_VARIABLE,
        prisma: this.prisma
      })

    // Check if the variable already exists in the project
    dto.name && (await this.variableExists(dto.name, variable.projectId))

    const shouldCreateRevisions = dto.entries && dto.entries.length > 0

    // Check if the user has access to the environments
    if (shouldCreateRevisions) {
      const environmentIds = dto.entries.map((entry) => entry.environmentId)
      await Promise.all(
        environmentIds.map(async (environmentId) => {
          const environment =
            await this.authorityCheckerService.checkAuthorityOverEnvironment({
              userId: user.id,
              entity: { id: environmentId },
              authority: Authority.READ_ENVIRONMENT,
              prisma: this.prisma
            })

          // Check if the environment belongs to the project
          if (environment.projectId !== variable.projectId) {
            throw new BadRequestException(
              `Environment: ${environmentId} does not belong to project: ${variable.projectId}`
            )
          }
        })
      )
    }

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
          note: dto.note,
          lastUpdatedById: user.id
        },
        select: {
          id: true,
          name: true,
          note: true
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
            environmentId: entry.environmentId
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
              environmentId: entry.environmentId,
              variableId: variable.id
            },
            select: {
              id: true,
              environmentId: true,
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
              environmentId: entry.environmentId,
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

  async rollbackVariable(
    user: User,
    variableId: Variable['id'],
    environmentId: Environment['id'],
    rollbackVersion: VariableVersion['version']
  ) {
    const variable =
      await this.authorityCheckerService.checkAuthorityOverVariable({
        userId: user.id,
        entity: { id: variableId },
        authority: Authority.UPDATE_VARIABLE,
        prisma: this.prisma
      })

    // Filter the variable versions by the environment
    variable.versions = variable.versions.filter(
      (version) => version.environmentId === environmentId
    )

    if (variable.versions.length === 0) {
      throw new NotFoundException(
        `No versions found for environment: ${environmentId} for variable: ${variableId}`
      )
    }

    // Sorting is in ascending order of dates. So the last element is the latest version
    const maxVersion = variable.versions[variable.versions.length - 1].version

    // Check if the rollback version is valid
    if (rollbackVersion < 1 || rollbackVersion >= maxVersion) {
      throw new NotFoundException(
        `Invalid rollback version: ${rollbackVersion} for variable: ${variableId}`
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

  async deleteVariable(user: User, variableId: Variable['id']) {
    const variable =
      await this.authorityCheckerService.checkAuthorityOverVariable({
        userId: user.id,
        entity: { id: variableId },
        authority: Authority.DELETE_VARIABLE,
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

  async getAllVariablesOfProjectAndEnvironment(
    user: User,
    projectId: Project['id'],
    environmentId: Environment['id']
  ) {
    // Check if the user has the required authorities in the project
    await this.authorityCheckerService.checkAuthorityOverProject({
      userId: user.id,
      entity: { id: projectId },
      authority: Authority.READ_VARIABLE,
      prisma: this.prisma
    })

    // Check if the user has the required authorities in the environment
    await this.authorityCheckerService.checkAuthorityOverEnvironment({
      userId: user.id,
      entity: { id: environmentId },
      authority: Authority.READ_ENVIRONMENT,
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

  async getAllVariablesOfProject(
    user: User,
    projectId: Project['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    // Check if the user has the required authorities in the project
    await this.authorityCheckerService.checkAuthorityOverProject({
      userId: user.id,
      entity: { id: projectId },
      authority: Authority.READ_VARIABLE,
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
          }
        })

        if (!latestVersion) continue

        if (variablesWithEnvironmentalValues.has(variable.id)) {
          variablesWithEnvironmentalValues.get(variable.id).values.push({
            environment: {
              id: latestVersion.environmentId,
              name: envIds.get(latestVersion.environmentId)
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
                  name: envIds.get(latestVersion.environmentId)
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

    const metadata = paginate(totalCount, `/variable/${projectId}`, {
      page: page,
      limit: limitMaxItemsPerPage(limit),
      sort,
      order,
      search
    })

    return { items, metadata }
  }

  async getRevisionsOfVariable(
    user: User,
    variableId: Variable['id'],
    environmentId: Environment['id'],
    page: number,
    limit: number,
    order: 'asc' | 'desc'
  ) {
    await this.authorityCheckerService.checkAuthorityOverVariable({
      userId: user.id,
      entity: { id: variableId },
      authority: Authority.READ_VARIABLE,
      prisma: this.prisma
    })

    await this.authorityCheckerService.checkAuthorityOverEnvironment({
      userId: user.id,
      entity: { id: environmentId },
      authority: Authority.READ_ENVIRONMENT,
      prisma: this.prisma
    })

    const revisions = await this.prisma.variableVersion.findMany({
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

    return revisions
  }

  private async variableExists(
    variableName: Variable['name'],
    projectId: Project['id']
  ) {
    if (
      (await this.prisma.variable.findFirst({
        where: {
          name: variableName,
          projectId
        }
      })) !== null
    ) {
      throw new ConflictException(
        `Variable already exists: ${variableName} in project ${projectId}`
      )
    }
  }
}
