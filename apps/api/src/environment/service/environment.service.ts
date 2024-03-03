import {
  BadRequestException,
  ConflictException,
  Injectable
} from '@nestjs/common'
import {
  ApprovalAction,
  ApprovalItemType,
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
import workspaceApprovalEnabled from '../../common/workspace-approval-enabled'
import { EnvironmentWithProject } from '../environment.types'
import createApproval from '../../common/create-approval'
import { UpdateEnvironmentMetadata } from '../../approval/approval.types'

@Injectable()
export class EnvironmentService {
  constructor(private readonly prisma: PrismaService) {}

  async createEnvironment(
    user: User,
    dto: CreateEnvironment,
    projectId: Project['id'],
    reason?: string
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
      throw new ConflictException(
        `Environment with name ${dto.name} already exists in project ${project.name} (${project.id})`
      )
    }

    // If the current environment needs to be the default one, we will
    // need to update the existing default environment to be a regular one
    const ops = []

    if (dto.isDefault) {
      ops.push(this.makeAllNonDefault(projectId))
    }

    const approvalEnabled = await workspaceApprovalEnabled(
      project.workspaceId,
      this.prisma
    )

    // Create the environment
    ops.push(
      this.prisma.environment.create({
        data: {
          name: dto.name,
          description: dto.description,
          isDefault: dto.isDefault,
          pendingCreation: project.pendingCreation || approvalEnabled,
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
          project: true
        }
      })
    )

    const result = await this.prisma.$transaction(ops)
    const environment: EnvironmentWithProject = result[result.length - 1]

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

    if (!project.pendingCreation && approvalEnabled) {
      const approval = await createApproval(
        {
          action: ApprovalAction.CREATE,
          itemType: ApprovalItemType.ENVIRONMENT,
          itemId: environment.id,
          reason,
          user,
          workspaceId: project.workspaceId
        },
        this.prisma
      )
      return {
        environment,
        approval
      }
    } else {
      return environment
    }
  }

  async updateEnvironment(
    user: User,
    dto: UpdateEnvironment,
    environmentId: Environment['id'],
    reason?: string
  ) {
    const environment = await getEnvironmentWithAuthority(
      user.id,
      environmentId,
      Authority.UPDATE_ENVIRONMENT,
      this.prisma
    )

    // Check if an environment with the same name already exists
    if (
      dto.name &&
      (environment.name === dto.name ||
        (await this.environmentExists(dto.name, environment.projectId)))
    ) {
      throw new ConflictException(
        `Environment with name ${dto.name} already exists in project ${environment.projectId}`
      )
    }

    if (
      !environment.pendingCreation &&
      (await workspaceApprovalEnabled(
        environment.project.workspaceId,
        this.prisma
      ))
    ) {
      return await createApproval(
        {
          action: ApprovalAction.UPDATE,
          itemType: ApprovalItemType.ENVIRONMENT,
          itemId: environment.id,
          reason,
          user,
          workspaceId: environment.project.workspaceId,
          metadata: dto
        },
        this.prisma
      )
    } else {
      return this.update(user, environment, dto)
    }
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
        pendingCreation: false,
        name: {
          contains: search
        }
      },
      include: {
        lastUpdatedBy: true
      },
      skip: page * limit,
      take: limit,
      orderBy: {
        [sort]: order
      }
    })
  }

  async deleteEnvironment(
    user: User,
    environmentId: Environment['id'],
    reason?: string
  ) {
    const environment = await getEnvironmentWithAuthority(
      user.id,
      environmentId,
      Authority.DELETE_ENVIRONMENT,
      this.prisma
    )

    // Check if the environment is the default one
    if (environment.isDefault) {
      throw new BadRequestException('Cannot delete the default environment')
    }

    if (environment.pendingCreation) {
      throw new BadRequestException(
        `Environment is pending creation and cannot be deleted. Delete the related approval to delete the environment.`
      )
    }

    if (
      await workspaceApprovalEnabled(
        environment.project.workspaceId,
        this.prisma
      )
    ) {
      return await createApproval(
        {
          action: ApprovalAction.DELETE,
          itemType: ApprovalItemType.ENVIRONMENT,
          itemId: environment.id,
          reason,
          user,
          workspaceId: environment.project.workspaceId
        },
        this.prisma
      )
    } else {
      return this.delete(user, environment)
    }
  }

  private async environmentExists(
    name: Environment['name'],
    projectId: Project['id']
  ) {
    return await this.prisma.environment.findFirst({
      where: {
        name,
        projectId,
        pendingCreation: false
      }
    })
  }

  private makeAllNonDefault(projectId: Project['id']) {
    return this.prisma.environment.updateMany({
      where: {
        projectId
      },
      data: {
        isDefault: false
      }
    })
  }

  async makeEnvironmentApproved(environmentId: Environment['id']) {
    const environment = await this.prisma.environment.findUnique({
      where: {
        id: environmentId
      }
    })

    const environmentExists = await this.prisma.environment.count({
      where: {
        name: environment.name,
        pendingCreation: false,
        projectId: environment.projectId
      }
    })

    if (environmentExists) {
      throw new ConflictException(
        `Environment with name ${environment.name} already exists in project ${environment.projectId}`
      )
    }

    await this.prisma.environment.update({
      where: {
        id: environmentId
      },
      data: {
        pendingCreation: false,
        secrets: {
          updateMany: {
            where: {
              environmentId
            },
            data: {
              pendingCreation: false
            }
          }
        },
        variables: {
          updateMany: {
            where: {
              environmentId
            },
            data: {
              pendingCreation: false
            }
          }
        }
      }
    })
  }

  async update(
    user: User,
    environment: Environment,
    dto: UpdateEnvironment | UpdateEnvironmentMetadata
  ) {
    const ops = []

    // If this environment is the last one, and is being updated to be non-default
    // we will skip this operation
    const count = await this.prisma.environment.count({
      where: {
        projectId: environment.projectId
      }
    })

    if (dto.isDefault === false && environment.isDefault && count === 1) {
      throw new BadRequestException(
        'Cannot make the last environment non-default'
      )
    }

    // If the current environment needs to be the default one, we will
    // need to update the existing default environment to be a regular one
    if (dto.isDefault) {
      ops.push(this.makeAllNonDefault(environment.projectId))
    }

    // Update the environment
    ops.push(
      this.prisma.environment.update({
        where: {
          id: environment.id
        },
        data: {
          name: dto.name,
          description: dto.description,
          isDefault:
            dto.isDefault !== undefined && dto.isDefault !== null
              ? dto.isDefault
              : environment.isDefault,
          lastUpdatedById: user.id
        },
        include: {
          secrets: true,
          lastUpdatedBy: true
        }
      })
    )

    const result = await this.prisma.$transaction(ops)
    const updatedEnvironment = result[result.length - 1]

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

  async delete(user: User, environment: EnvironmentWithProject) {
    const op = []

    // Delete the environment
    op.push(
      this.prisma.environment.delete({
        where: {
          id: environment.id
        }
      })
    )

    // If the environment is in pending creation state and the workspace has approval enabled,
    // we will need to delete the approval as well
    if (
      environment.pendingCreation &&
      (await workspaceApprovalEnabled(
        environment.project.workspaceId,
        this.prisma
      ))
    ) {
      op.push(
        this.prisma.approval.deleteMany({
          where: {
            itemId: environment.id,
            itemType: ApprovalItemType.ENVIRONMENT
          }
        })
      )
    }

    await this.prisma.$transaction(op)

    createEvent(
      {
        triggeredBy: user,
        type: EventType.ENVIRONMENT_DELETED,
        source: EventSource.ENVIRONMENT,
        title: `Environment deleted`,
        metadata: {
          environmentId: environment.id,
          name: environment.name,
          projectId: environment.projectId
        }
      },
      this.prisma
    )
  }
}
