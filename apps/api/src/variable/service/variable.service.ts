import {
  BadRequestException,
  ConflictException,
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
import getProjectWithAuthority from '../../common/get-project-with-authority'
import getEnvironmentWithAuthority from '../../common/get-environment-with-authority'
import getDefaultEnvironmentOfProject from '../../common/get-default-project-environment'
import createEvent from '../../common/create-event'
import { UpdateVariable } from '../dto/update.variable/update.variable'
import getVariableWithAuthority from '../../common/get-variable-with-authority'

@Injectable()
export class VariableService {
  private readonly logger = new Logger(VariableService.name)

  constructor(private readonly prisma: PrismaService) {}

  async createVariable(
    user: User,
    dto: CreateVariable,
    projectId: Project['id']
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

    // Create the variable
    const variable = await this.prisma.variable.create({
      data: {
        name: dto.name,
        note: dto.note,
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
      }
    })

    createEvent(
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
        }
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
    const variable = await getVariableWithAuthority(
      user.id,
      variableId,
      Authority.UPDATE_VARIABLE,
      this.prisma
    )

    let result

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

    // Update the variable
    // If a new variable value is proposed, we want to create a new version for that variable
    if (dto.value) {
      const previousVersion = await this.prisma.variableVersion.findFirst({
        where: {
          variableId
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
          id: variableId
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
    } else {
      result = await this.prisma.variable.update({
        where: {
          id: variableId
        },
        data: {
          note: dto.note ?? variable.note,
          name: dto.name ?? variable.name,
          lastUpdatedById: user.id
        }
      })
    }

    createEvent(
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
        }
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} updated variable ${variable.id}`)

    return result
  }

  async updateVariableEnvironment(
    user: User,
    variableId: Variable['id'],
    environmentId: Environment['id']
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
    if (await this.variableExists(variable.name, environment.id)) {
      throw new ConflictException(
        `Variable already exists: ${variable.name} in environment ${environment.id} in project ${variable.projectId}`
      )
    }

    // Update the variable
    const result = await this.prisma.variable.update({
      where: {
        id: variableId
      },
      data: {
        environment: {
          connect: {
            id: environmentId
          }
        }
      }
    })

    createEvent(
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
        }
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} updated variable ${variable.id}`)

    return result
  }

  async rollbackVariable(
    user: User,
    variableId: Variable['id'],
    rollbackVersion: VariableVersion['version']
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

    // Rollback the variable
    const result = await this.prisma.variableVersion.deleteMany({
      where: {
        variableId,
        version: {
          gt: Number(rollbackVersion)
        }
      }
    })

    createEvent(
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
        }
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} rolled back variable ${variable.id}`)

    return result
  }

  async deleteVariable(user: User, variableId: Variable['id']) {
    const variable = await getVariableWithAuthority(
      user.id,
      variableId,
      Authority.DELETE_VARIABLE,
      this.prisma
    )

    await this.prisma.variable.delete({
      where: {
        id: variableId
      }
    })

    createEvent(
      {
        triggeredBy: user,
        type: EventType.VARIABLE_DELETED,
        source: EventSource.VARIABLE,
        title: `Variable deleted`,
        metadata: {
          variableId: variable.id,
          name: variable.name,
          projectId: variable.projectId,
          projectName: variable.project.name
        }
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} deleted variable ${variable.id}`)
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
          environment: {
            id: environmentId
          }
        }
      })) > 0
    )
  }
}
