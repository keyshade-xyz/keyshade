import { ConflictException, Injectable } from '@nestjs/common'
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
import getProjectWithAuthority from '../../common/get-project-with-authority'
import getEnvironmentWithAuthority from '../../common/get-environment-with-authority'
import createEvent from '../../common/create-event'

@Injectable()
export class EnvironmentService {
  constructor(private readonly prisma: PrismaService) {}

  async createEnvironment(
    user: User,
    dto: CreateEnvironment,
    projectId: Project['id']
  ) {
    // Check if the user has the required role to create an environment
    const project = await getProjectWithAuthority(
      user.id,
      projectId,
      Authority.CREATE_ENVIRONMENT,
      this.prisma
    )

    // Check if an environment with the same name already exists
    if (await this.environmentExists(dto.name, projectId)) {
      throw new ConflictException('Environment already exists')
    }

    // If the current environment needs to be the default one, we will
    // need to update the existing default environment to be a regular one
    const ops = []

    if (dto.isDefault) {
      ops.push(this.makeAllNonDefault(projectId))
    }

    // Create the environment
    ops.unshift(
      this.prisma.environment.create({
        data: {
          name: dto.name,
          description: dto.description,
          isDefault: dto.isDefault,
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
    )

    const result = await this.prisma.$transaction(ops)
    const environment = result[0] as Environment

    createEvent(
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
        }
      },
      this.prisma
    )

    return environment
  }

  async updateEnvironment(
    user: User,
    dto: UpdateEnvironment,
    environmentId: Environment['id']
  ) {
    const environment = await getEnvironmentWithAuthority(
      user.id,
      environmentId,
      Authority.UPDATE_ENVIRONMENT,
      this.prisma
    )

    // Check if an environment with the same name already exists
    if (
      (dto.name &&
        (await this.environmentExists(dto.name, environment.projectId))) ||
      environment.name === dto.name
    ) {
      throw new ConflictException('Environment already exists')
    }

    const ops = []

    // If the current environment needs to be the default one, we will
    // need to update the existing default environment to be a regular one
    if (dto.isDefault) {
      ops.push(this.makeAllNonDefault(environment.projectId))
    }

    // Update the environment
    ops.unshift(
      this.prisma.environment.update({
        where: {
          id: environmentId
        },
        data: {
          name: dto.name,
          description: dto.description,
          isDefault: dto.isDefault,
          lastUpdatedById: user.id
        },
        include: {
          secrets: true,
          lastUpdatedBy: true
        }
      })
    )

    const result = await this.prisma.$transaction(ops)
    const updatedEnvironment = result[0] as Environment

    createEvent(
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
        }
      },
      this.prisma
    )

    return updatedEnvironment
  }

  async getEnvironment(user: User, environmentId: Environment['id']) {
    const environment = await getEnvironmentWithAuthority(
      user.id,
      environmentId,
      Authority.READ_ENVIRONMENT,
      this.prisma
    )

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
    await getProjectWithAuthority(
      user.id,
      projectId,
      Authority.READ_ENVIRONMENT,
      this.prisma
    )

    // Get the environments
    return await this.prisma.environment.findMany({
      where: {
        projectId,
        name: {
          contains: search
        }
      },
      include: {
        lastUpdatedBy: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort]: order
      }
    })
  }

  async getAllEnvironments(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    // Get the environments
    return await this.prisma.environment.findMany({
      where: {
        name: {
          contains: search
        }
      },
      include: {
        lastUpdatedBy: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort]: order
      }
    })
  }

  async deleteEnvironment(user: User, environmentId: Environment['id']) {
    const environment = await getEnvironmentWithAuthority(
      user.id,
      environmentId,
      Authority.DELETE_ENVIRONMENT,
      this.prisma
    )

    const projectId = environment.projectId

    // Check if the environment is the default one
    if (environment.isDefault) {
      throw new ConflictException('Cannot delete the default environment')
    }

    // Check if this is the last environment
    const count = await this.prisma.environment.count({
      where: {
        projectId
      }
    })
    if (count === 1) {
      throw new ConflictException('Cannot delete the last environment')
    }

    // Delete the environment
    await this.prisma.environment.delete({
      where: {
        id: environmentId
      }
    })

    createEvent(
      {
        triggeredBy: user,
        entity: environment,
        type: EventType.ENVIRONMENT_DELETED,
        source: EventSource.ENVIRONMENT,
        title: `Environment deleted`,
        metadata: {
          environmentId: environment.id,
          name: environment.name,
          projectId
        }
      },
      this.prisma
    )
  }

  private async environmentExists(
    name: Environment['name'],
    projectId: Project['id']
  ) {
    return await this.prisma.environment.findFirst({
      where: {
        name,
        projectId
      }
    })
  }

  private async makeAllNonDefault(projectId: Project['id']): Promise<void> {
    this.prisma.environment.updateMany({
      where: {
        projectId
      },
      data: {
        isDefault: false
      }
    })
  }
}
