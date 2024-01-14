import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { Environment, Project, User } from '@prisma/client'
import { CreateEnvironment } from '../dto/create.environment/create.environment'
import { ProjectPermission } from '../../project/misc/project.permission'
import { UpdateEnvironment } from '../dto/update.environment/update.environment'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class EnvironmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectPermissionService: ProjectPermission
  ) {}

  async createEnvironment(
    user: User,
    dto: CreateEnvironment,
    projectId: Project['id']
  ) {
    // Check if the project exists
    const project = await this.getProjectByUserIdAndId(user.id, projectId)
    if (!project) {
      throw new NotFoundException('Project not found')
    }

    // Check if the user can manage environments of the project
    await this.projectPermissionService.isProjectMaintainer(user, projectId)

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
        projectId,
        lastUpdatedById: user.id
      }
    })
  }

  async updateEnvironment(
    user: User,
    dto: UpdateEnvironment,
    projectId: Project['id'],
    environmentId: Environment['id']
  ) {
    // Check if the project exists
    const project = await this.getProjectByUserIdAndId(user.id, projectId)
    if (!project) {
      throw new NotFoundException('Project not found')
    }

    // Check if the user can manage environments of the project
    await this.projectPermissionService.isProjectMaintainer(user, projectId)

    // Check if the environment exists
    const environment = await this.getByProjectIdAndId(projectId, environmentId)
    if (!environment) {
      throw new NotFoundException('Environment not found')
    }

    // Check if an environment with the same name already exists
    if (dto.name && (await this.environmentExists(dto.name, projectId))) {
      throw new ConflictException('Environment already exists')
    }

    // If the current environment needs to be the default one, we will
    // need to update the existing default environment to be a regular one
    if (dto.isDefault) {
      await this.makeAllNonDefault(projectId)
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

  async getEnvironmentByProjectIdAndId(
    user: User,
    projectId: Project['id'],
    environmentId: Environment['id']
  ) {
    // Check if the project exists
    const project = await this.getProjectByUserIdAndId(user.id, projectId)
    if (!project) {
      throw new NotFoundException('Project not found')
    }

    // Check if the user can manage environments of the project
    await this.projectPermissionService.isProjectMaintainer(user, projectId)

    // Check if the environment exists
    const environment = await this.getByProjectIdAndId(projectId, environmentId)
    if (!environment) {
      throw new NotFoundException('Environment not found')
    }

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
    // Check if the project exists
    const project = await this.getProjectByUserIdAndId(user.id, projectId)
    if (!project) {
      throw new NotFoundException('Project not found')
    }

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

  async deleteEnvironment(
    user: User,
    projectId: Project['id'],
    environmentId: Environment['id']
  ) {
    // Check if the project exists
    const project = await this.getProjectByUserIdAndId(user.id, projectId)
    if (!project) {
      throw new NotFoundException('Project not found')
    }

    // Check if the user can manage environments of the project
    await this.projectPermissionService.isProjectMaintainer(user, projectId)

    // Check if the environment exists
    const environment = await this.getByProjectIdAndId(projectId, environmentId)
    if (!environment) {
      throw new NotFoundException('Environment not found')
    }

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

  private async getProjectByUserIdAndId(
    userId: User['id'],
    projectId: Project['id']
  ): Promise<Project> {
    return await this.prisma.project.findFirst({
      where: {
        id: projectId,
        members: {
          some: {
            userId
          }
        }
      },
      include: {
        members: true
      }
    })
  }
}
