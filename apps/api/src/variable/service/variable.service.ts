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
  ApprovalAction,
  ApprovalItemType,
  ApprovalStatus,
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
import getProjectWithAuthority from '../../common/get-project-with-authority'
import getEnvironmentWithAuthority from '../../common/get-environment-with-authority'
import getDefaultEnvironmentOfProject from '../../common/get-default-project-environment'
import createEvent from '../../common/create-event'
import { UpdateVariable } from '../dto/update.variable/update.variable'
import getVariableWithAuthority from '../../common/get-variable-with-authority'
import workspaceApprovalEnabled from '../../common/workspace-approval-enabled'
import createApproval from '../../common/create-approval'
import { UpdateVariableMetadata } from '../../approval/approval.types'
import {
  VariableWithProject,
  VariableWithProjectAndVersion
} from '../variable.types'
import { RedisClientType } from 'redis'
import { REDIS_CLIENT } from '../../provider/redis.provider'
import { CHANGE_NOTIFIER_RSC } from '../../socket/change-notifier.socket'

@Injectable()
export class VariableService {
  private readonly logger = new Logger(VariableService.name)
  private readonly redis: RedisClientType

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT)
    readonly redisClient: {
      publisher: RedisClientType
    }
  ) {
    this.redis = redisClient.publisher
  }

  async createVariable(
    user: User,
    dto: CreateVariable,
    projectId: Project['id'],
    reason?: string
  ) {
    const environmentId = dto.environmentId
    // Fetch the project
    const project = await getProjectWithAuthority(
      user.id,
      projectId,
      Authority.CREATE_VARIABLE,
      this.prisma
    )

    // Check i the environment exists
    let environment: Environment | null = null
    if (environmentId) {
      environment = await getEnvironmentWithAuthority(
        user.id,
        environmentId,
        Authority.READ_ENVIRONMENT,
        this.prisma
      )
    }
    if (!environment) {
      environment = await getDefaultEnvironmentOfProject(projectId, this.prisma)
    }

    // If any default environment was not found, throw an error
    if (!environment) {
      throw new NotFoundException(
        `No default environment found for project with id ${projectId}`
      )
    }

    // Check if the variable already exists in the environment
    if (await this.variableExists(dto.name, environment.id)) {
      throw new ConflictException(
        `Variable already exists: ${dto.name} in environment ${environment.id} in project ${projectId}`
      )
    }

    const approvalEnabled = await workspaceApprovalEnabled(
      project.workspaceId,
      this.prisma
    )

    // Create the variable
    const variable = await this.prisma.variable.create({
      data: {
        name: dto.name,
        note: dto.note,
        pendingCreation:
          project.pendingCreation ||
          environment.pendingCreation ||
          approvalEnabled,
        versions: {
          create: {
            value: dto.value,
            version: 1,
            createdBy: {
              connect: {
                id: user.id
              }
            }
          }
        },
        environment: {
          connect: {
            id: environment.id
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
          projectName: project.name,
          environmentId: environment.id,
          environmentName: environment.name
        },
        workspaceId: project.workspaceId
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} created variable ${variable.id}`)

    if (
      !project.pendingCreation &&
      !environment.pendingCreation &&
      approvalEnabled
    ) {
      const approval = await createApproval(
        {
          action: ApprovalAction.CREATE,
          itemType: ApprovalItemType.VARIABLE,
          itemId: variable.id,
          reason,
          user,
          workspaceId: project.workspaceId
        },
        this.prisma
      )
      return {
        variable,
        approval
      }
    } else {
      return variable
    }
  }

  async updateVariable(
    user: User,
    variableId: Variable['id'],
    dto: UpdateVariable,
    reason?: string
  ) {
    const variable = await getVariableWithAuthority(
      user.id,
      variableId,
      Authority.UPDATE_VARIABLE,
      this.prisma
    )

    // Check if the variable already exists in the environment
    if (
      (dto.name &&
        (await this.variableExists(dto.name, variable.environmentId))) ||
      variable.name === dto.name
    ) {
      throw new ConflictException(
        `Variable already exists: ${dto.name} in environment ${variable.environmentId}`
      )
    }

    if (
      !variable.pendingCreation &&
      (await workspaceApprovalEnabled(
        variable.project.workspaceId,
        this.prisma
      ))
    ) {
      return await createApproval(
        {
          action: ApprovalAction.UPDATE,
          itemType: ApprovalItemType.VARIABLE,
          itemId: variable.id,
          reason,
          user,
          workspaceId: variable.project.workspaceId,
          metadata: dto
        },
        this.prisma
      )
    } else {
      return this.update(dto, user, variable)
    }
  }

  async updateVariableEnvironment(
    user: User,
    variableId: Variable['id'],
    environmentId: Environment['id'],
    reason?: string
  ) {
    const variable = await getVariableWithAuthority(
      user.id,
      variableId,
      Authority.UPDATE_VARIABLE,
      this.prisma
    )

    if (variable.environmentId === environmentId) {
      throw new BadRequestException(
        `Can not update the environment of the variable to the same environment: ${environmentId}`
      )
    }

    // Check if the environment exists
    const environment = await getEnvironmentWithAuthority(
      user.id,
      environmentId,
      Authority.READ_ENVIRONMENT,
      this.prisma
    )

    // Check if the environment belongs to the same project
    if (environment.projectId !== variable.projectId) {
      throw new BadRequestException(
        `Environment ${environmentId} does not belong to the same project ${variable.projectId}`
      )
    }

    // Check if the variable already exists in the environment
    if (
      !variable.pendingCreation &&
      (await this.variableExists(variable.name, environment.id))
    ) {
      throw new ConflictException(
        `Variable already exists: ${variable.name} in environment ${environment.id} in project ${variable.projectId}`
      )
    }

    if (
      await workspaceApprovalEnabled(variable.project.workspaceId, this.prisma)
    ) {
      return await createApproval(
        {
          action: ApprovalAction.UPDATE,
          itemType: ApprovalItemType.VARIABLE,
          itemId: variable.id,
          reason,
          user,
          workspaceId: variable.project.workspaceId,
          metadata: {
            environmentId
          }
        },
        this.prisma
      )
    } else {
      return this.updateEnvironment(user, variable, environment)
    }
  }

  async rollbackVariable(
    user: User,
    variableId: Variable['id'],
    rollbackVersion: VariableVersion['version'],
    reason?: string
  ) {
    const variable = await getVariableWithAuthority(
      user.id,
      variableId,
      Authority.UPDATE_VARIABLE,
      this.prisma
    )

    const maxVersion = variable.versions[variable.versions.length - 1].version

    // Check if the rollback version is valid
    if (rollbackVersion < 1 || rollbackVersion >= maxVersion) {
      throw new NotFoundException(
        `Invalid rollback version: ${rollbackVersion} for variable: ${variableId}`
      )
    }

    if (
      !variable.pendingCreation &&
      (await workspaceApprovalEnabled(
        variable.project.workspaceId,
        this.prisma
      ))
    ) {
      return await createApproval(
        {
          action: ApprovalAction.UPDATE,
          itemType: ApprovalItemType.VARIABLE,
          itemId: variable.id,
          reason,
          user,
          workspaceId: variable.project.workspaceId,
          metadata: {
            rollbackVersion
          }
        },
        this.prisma
      )
    } else {
      return this.rollback(user, variable, rollbackVersion)
    }
  }

  async deleteVariable(
    user: User,
    variableId: Variable['id'],
    reason?: string
  ) {
    const variable = await getVariableWithAuthority(
      user.id,
      variableId,
      Authority.DELETE_VARIABLE,
      this.prisma
    )

    if (
      !variable.pendingCreation &&
      (await workspaceApprovalEnabled(
        variable.project.workspaceId,
        this.prisma
      ))
    ) {
      return await createApproval(
        {
          action: ApprovalAction.DELETE,
          itemType: ApprovalItemType.VARIABLE,
          itemId: variable.id,
          reason,
          user,
          workspaceId: variable.project.workspaceId
        },
        this.prisma
      )
    } else {
      return this.delete(user, variable)
    }
  }

  async getVariableById(user: User, variableId: Variable['id']) {
    return getVariableWithAuthority(
      user.id,
      variableId,
      Authority.READ_VARIABLE,
      this.prisma
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
    await getProjectWithAuthority(
      user.id,
      projectId,
      Authority.READ_VARIABLE,
      this.prisma
    )

    return await this.prisma.variable.findMany({
      where: {
        projectId,
        pendingCreation: false,
        name: {
          contains: search
        }
      },
      include: {
        versions: {
          orderBy: {
            version: 'desc'
          },
          take: 1
        },
        lastUpdatedBy: {
          select: {
            id: true,
            name: true
          }
        },
        environment: {
          select: {
            id: true,
            name: true
          }
        }
      },
      skip: page * limit,
      take: limit,
      orderBy: {
        [sort]: order
      }
    })
  }

  private async variableExists(
    variableName: Variable['name'],
    environmentId: Environment['id']
  ): Promise<boolean> {
    return (
      (await this.prisma.variable.count({
        where: {
          name: variableName,
          pendingCreation: false,
          environment: {
            id: environmentId
          }
        }
      })) > 0
    )
  }

  async makeVariableApproved(variableId: Variable['id']): Promise<any> {
    const variable = await this.prisma.variable.findUnique({
      where: {
        id: variableId
      }
    })

    const variableExists = await this.prisma.variable.count({
      where: {
        name: variable.name,
        pendingCreation: false,
        environmentId: variable.environmentId,
        projectId: variable.projectId
      }
    })

    if (variableExists > 0) {
      throw new ConflictException(
        `Variable already exists: ${variable.name} in environment ${variable.environmentId} in project ${variable.projectId}`
      )
    }

    return this.prisma.variable.update({
      where: {
        id: variableId
      },
      data: {
        pendingCreation: false
      }
    })
  }

  async update(
    dto: UpdateVariable | UpdateVariableMetadata,
    user: User,
    variable: VariableWithProjectAndVersion
  ) {
    let result

    // Update the variable
    // If a new variable value is proposed, we want to create a new version for that variable
    if (dto.value) {
      const previousVersion = await this.prisma.variableVersion.findFirst({
        where: {
          variableId: variable.id
        },
        select: {
          version: true
        },
        orderBy: {
          version: 'desc'
        },
        take: 1
      })

      result = await this.prisma.variable.update({
        where: {
          id: variable.id
        },
        data: {
          name: dto.name,
          note: dto.note,
          lastUpdatedById: user.id,
          versions: {
            create: {
              value: dto.value,
              version: previousVersion.version + 1,
              createdById: user.id
            }
          }
        }
      })

      try {
        await this.redis.publish(
          CHANGE_NOTIFIER_RSC,
          JSON.stringify({
            environmentId: variable.environmentId,
            name: variable.name,
            value: dto.value,
            isSecret: false
          })
        )
      } catch (error) {
        this.logger.error(`Error publishing variable update to Redis: ${error}`)
      }
    } else {
      result = await this.prisma.variable.update({
        where: {
          id: variable.id
        },
        data: {
          note: dto.note,
          name: dto.name,
          lastUpdatedById: user.id
        }
      })
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

  async updateEnvironment(
    user: User,
    variable: VariableWithProject,
    environment: Environment
  ) {
    // Update the variable
    const result = await this.prisma.variable.update({
      where: {
        id: variable.id
      },
      data: {
        environment: {
          connect: {
            id: environment.id
          }
        }
      }
    })

    await createEvent(
      {
        triggeredBy: user,
        entity: variable,
        type: EventType.VARIABLE_UPDATED,
        source: EventSource.VARIABLE,
        title: `Variable environment updated`,
        metadata: {
          variableId: variable.id,
          name: variable.name,
          projectId: variable.projectId,
          projectName: variable.project.name,
          environmentId: environment.id,
          environmentName: environment.name
        },
        workspaceId: variable.project.workspaceId
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} updated variable ${variable.id}`)

    return result
  }

  async rollback(
    user: User,
    variable: VariableWithProjectAndVersion,
    rollbackVersion: VariableVersion['version']
  ) {
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
      await this.redis.publish(
        CHANGE_NOTIFIER_RSC,
        JSON.stringify({
          environmentId: variable.environmentId,
          name: variable.name,
          value: variable.versions[rollbackVersion - 1].value,
          isSecret: false
        })
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

  async delete(user: User, variable: VariableWithProject) {
    const op = []

    // Delete the variable
    op.push(
      this.prisma.variable.delete({
        where: {
          id: variable.id
        }
      })
    )

    // If the variable is in pending creation and the workspace approval is enabled, we need to delete the approval
    if (
      variable.pendingCreation &&
      (await workspaceApprovalEnabled(
        variable.project.workspaceId,
        this.prisma
      ))
    ) {
      op.push(
        this.prisma.approval.deleteMany({
          where: {
            itemId: variable.id,
            itemType: ApprovalItemType.VARIABLE,
            status: ApprovalStatus.PENDING,
            action: ApprovalAction.CREATE
          }
        })
      )
    }

    await this.prisma.$transaction(op)

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
}
