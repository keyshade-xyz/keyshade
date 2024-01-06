import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import {
  ENVIRONMENT_REPOSITORY,
  IEnvironmentRepository
} from '../repository/interface.repository'
import { Environment, Project, User } from '@prisma/client'
import { CreateEnvironment } from '../dto/create.environment/create.environment'
import { ProjectPermission } from '../../project/misc/project.permission'
import {
  IProjectRepository,
  PROJECT_REPOSITORY
} from '../../project/repository/interface.repository'
import { UpdateEnvironment } from '../dto/update.environment/update.environment'

@Injectable()
export class EnvironmentService {
  constructor(
    @Inject(ENVIRONMENT_REPOSITORY)
    private readonly environmentRepository: IEnvironmentRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    private readonly projectPermissionService: ProjectPermission
  ) {}

  async createEnvironment(
    user: User,
    dto: CreateEnvironment,
    projectId: Project['id']
  ) {
    // Check if the project exists
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )
    if (!project) {
      throw new NotFoundException('Project not found')
    }

    // Check if the user can manage environments of the project
    await this.projectPermissionService.canManageEnvironmentsOfProject(
      user,
      projectId
    )

    // Check if an environment with the same name already exists
    if (
      await this.environmentRepository.environmentExists(dto.name, projectId)
    ) {
      throw new ConflictException('Environment already exists')
    }

    // If the current environment needs to be the default one, we will
    // need to update the existing default environment to be a regular one
    if (dto.isDefault) {
      await this.environmentRepository.makeAllNonDefault(projectId)
    }

    // Create the environment
    return this.environmentRepository.createEnvironment(dto, projectId, user.id)
  }

  async updateEnvironment(
    user: User,
    dto: UpdateEnvironment,
    projectId: Project['id'],
    environmentId: Environment['id']
  ) {
    // Check if the project exists
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )
    if (!project) {
      throw new NotFoundException('Project not found')
    }

    // Check if the user can manage environments of the project
    await this.projectPermissionService.canManageEnvironmentsOfProject(
      user,
      projectId
    )

    // Check if the environment exists
    const environment =
      await this.environmentRepository.getEnvironmentByProjectIdAndId(
        projectId,
        environmentId
      )
    if (!environment) {
      throw new NotFoundException('Environment not found')
    }

    // Check if an environment with the same name already exists
    if (
      dto.name &&
      (await this.environmentRepository.environmentExists(dto.name, projectId))
    ) {
      throw new ConflictException('Environment already exists')
    }

    // If the current environment needs to be the default one, we will
    // need to update the existing default environment to be a regular one
    if (dto.isDefault) {
      await this.environmentRepository.makeAllNonDefault(projectId)
    }

    // Update the environment
    return this.environmentRepository.updateEnvironment(
      environmentId,
      dto,
      user.id
    )
  }

  async getEnvironmentByProjectIdAndId(
    user: User,
    projectId: Project['id'],
    environmentId: Environment['id']
  ) {
    // Check if the project exists
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )
    if (!project) {
      throw new NotFoundException('Project not found')
    }

    // Check if the user can manage environments of the project
    await this.projectPermissionService.canManageEnvironmentsOfProject(
      user,
      projectId
    )

    // Check if the environment exists
    const environment =
      await this.environmentRepository.getEnvironmentByProjectIdAndId(
        projectId,
        environmentId
      )
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
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )
    if (!project) {
      throw new NotFoundException('Project not found')
    }

    // Check if the user can manage environments of the project
    await this.projectPermissionService.canManageEnvironmentsOfProject(
      user,
      projectId
    )

    // Get the environments
    return this.environmentRepository.getEnvironmentsOfProject(
      projectId,
      page,
      limit,
      sort,
      order,
      search
    )
  }

  async getAllEnvironments(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    // Get the environments
    return this.environmentRepository.getEnvironments(
      page,
      limit,
      sort,
      order,
      search
    )
  }

  async deleteEnvironment(
    user: User,
    projectId: Project['id'],
    environmentId: Environment['id']
  ) {
    // Check if the project exists
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )
    if (!project) {
      throw new NotFoundException('Project not found')
    }

    // Check if the user can manage environments of the project
    await this.projectPermissionService.canManageEnvironmentsOfProject(
      user,
      projectId
    )

    // Check if the environment exists
    const environment =
      await this.environmentRepository.getEnvironmentByProjectIdAndId(
        projectId,
        environmentId
      )
    if (!environment) {
      throw new NotFoundException('Environment not found')
    }

    // Check if the environment is the default one
    if (environment.isDefault) {
      throw new ConflictException('Cannot delete the default environment')
    }

    // Check if this is the last environment
    if (
      (await this.environmentRepository.countTotalEnvironmentsInProject(
        projectId
      )) === 1
    ) {
      throw new ConflictException('Cannot delete the last environment')
    }

    // Delete the environment
    return this.environmentRepository.deleteEnvironment(environmentId)
  }
}
