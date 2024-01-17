import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { Environment, Project, User, WorkspaceRole } from '@prisma/client'
import { CreateEnvironment } from '../dto/create.environment/create.environment'
import { UpdateEnvironment } from '../dto/update.environment/update.environment'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class EnvironmentService {
  constructor(private readonly prisma: PrismaService) {}

  async createEnvironment(
    user: User,
    dto: CreateEnvironment,
    projectId: Project['id']
  ) {
    // Check if the user has the required role to create an environment
    await this.getProjectWithRole(user.id, projectId, WorkspaceRole.MAINTAINER)

    // Check if an environment with the same name already exists
    if (await this.environmentExists(dto.name, projectId)) {
      throw new ConflictException('Environment already exists')
    }

    // If the current environment needs to be the default one, we will
    // need to update the existing default environment to be a regular one
    if (dto.isDefault) {
      await this.makeAllNonDefault(projectId)
    }

    // Create the environment
    return await this.prisma.environment.create({
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
  }

  async updateEnvironment(
    user: User,
    dto: UpdateEnvironment,
    environmentId: Environment['id']
  ) {
    const environment = await this.getEnvironmentWithRole(
      user.id,
      environmentId,
      WorkspaceRole.MAINTAINER
    )

    // Check if an environment with the same name already exists
    if (
      (dto.name &&
        (await this.environmentExists(dto.name, environment.projectId))) ||
      environment.name === dto.name
    ) {
      throw new ConflictException('Environment already exists')
    }

    // If the current environment needs to be the default one, we will
    // need to update the existing default environment to be a regular one
    if (dto.isDefault) {
      await this.makeAllNonDefault(environment.projectId)
    }

    // Update the environment
    return await this.prisma.environment.update({
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
  }

  async getEnvironment(user: User, environmentId: Environment['id']) {
    const environment = await this.getEnvironmentWithRole(
      user.id,
      environmentId,
      WorkspaceRole.VIEWER
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
    await this.getProjectWithRole(user.id, projectId, WorkspaceRole.VIEWER)

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
    const environment = await this.getEnvironmentWithRole(
      user.id,
      environmentId,
      WorkspaceRole.MAINTAINER
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
    return await this.prisma.environment.delete({
      where: {
        id: environmentId
      }
    })
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

  private async getByProjectIdAndId(
    projectId: Project['id'],
    environmentId: Environment['id']
  ) {
    return await this.prisma.environment.findFirst({
      where: {
        id: environmentId,
        projectId
      },
      include: {
        secrets: true,
        lastUpdatedBy: true
      }
    })
  }

  private async makeAllNonDefault(projectId: Project['id']): Promise<void> {
    await this.prisma.environment.updateMany({
      where: {
        projectId
      },
      data: {
        isDefault: false
      }
    })
  }

  private async getEnvironmentWithRole(
    userId: User['id'],
    environmentId: Environment['id'],
    role: WorkspaceRole
  ): Promise<Environment> {
    // Fetch the environment
    const environment = await this.prisma.environment.findUnique({
      where: {
        id: environmentId
      },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: true
              }
            }
          }
        }
      }
    })

    if (!environment) {
      throw new NotFoundException(
        `Environment with id ${environmentId} not found`
      )
    }

    // Check for the required membership role
    if (
      !environment.project.workspace.members.some(
        (member) => member.userId === userId && member.role === role
      )
    )
      throw new UnauthorizedException(
        `You don't have the required role to access this environment`
      )

    // Remove the workspace from the environment
    environment.project.workspace = undefined

    return environment
  }

  private async getProjectWithRole(
    userId: User['id'],
    projectId: Project['id'],
    role: WorkspaceRole
  ): Promise<Project> {
    // Fetch the project
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId
      },
      include: {
        workspace: {
          include: {
            members: true
          }
        }
      }
    })

    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`)
    }

    // Check for the required membership role
    if (
      !project.workspace.members.some(
        (member) => member.userId === userId && member.role === role
      )
    )
      throw new UnauthorizedException(
        `You don't have the required role to access this project`
      )

    // Remove the workspace from the project
    project.workspace = undefined

    return project
  }
}
