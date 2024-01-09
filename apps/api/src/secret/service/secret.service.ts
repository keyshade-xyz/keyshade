import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import {
  IProjectRepository,
  PROJECT_REPOSITORY
} from '../../project/repository/interface.repository'
import {
  ISecretRepository,
  SECRET_REPOSITORY
} from '../repository/interface.repository'
import {
  Environment,
  Project,
  Secret,
  SecretVersion,
  User
} from '@prisma/client'
import { CreateSecret } from '../dto/create.secret/create.secret'
import { ProjectPermission } from '../../project/misc/project.permission'
import {
  ENVIRONMENT_REPOSITORY,
  IEnvironmentRepository
} from '../../environment/repository/interface.repository'
import { UpdateSecret } from '../dto/update.secret/update.secret'
import { decrypt } from '../../common/decrypt'
import { SecretWithVersion } from '../secret.types'

@Injectable()
export class SecretService {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    @Inject(SECRET_REPOSITORY)
    private readonly secretReposiotory: ISecretRepository,
    @Inject(ENVIRONMENT_REPOSITORY)
    private readonly environmentRepository: IEnvironmentRepository,
    private readonly projectPermission: ProjectPermission
  ) {}

  private async secretExists(
    user: User,
    secretName: Secret['name'],
    environmentId: Environment['name'],
    projectId: Project['id']
  ) {
    return await this.secretReposiotory.secretExists(
      user.id,
      secretName,
      environmentId,
      projectId
    )
  }

  async createSecret(user: User, dto: CreateSecret, projectId: Project['id']) {
    const environmentId = dto.environmentId
    // Fetch the project
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )
    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`)
    }

    // Check if the project can create secrets in the project
    await this.projectPermission.isProjectMaintainer(user, projectId)

    // Check if the environment exists
    let environment: Environment | null = null
    if (environmentId) {
      environment =
        await this.environmentRepository.getEnvironmentByProjectIdAndId(
          projectId,
          environmentId
        )
      if (!environment) {
        throw new NotFoundException(
          `Environment not found: ${environmentId} in project ${projectId}`
        )
      }
    }
    if (!environment) {
      environment =
        await this.environmentRepository.getDefaultEnvironmentOfProject(
          projectId
        )
    }

    // If any default environment was not found, throw an error
    if (!environment) {
      throw new NotFoundException(
        `No default environment found for project: ${projectId}`
      )
    }

    // Check if the secret already exists in the environment
    if (await this.secretExists(user, dto.name, environment.id, projectId)) {
      throw new ConflictException(
        `Secret already exists: ${dto.name} in environment ${environment.name} in project ${projectId}`
      )
    }

    // Create the secret
    return await this.secretReposiotory.createSecret(
      dto,
      projectId,
      environment.id,
      user.id
    )
  }

  async updateSecret(
    user: User,
    secretId: Secret['id'],
    dto: UpdateSecret,
    projectId: Project['id']
  ) {
    // Fetch the project
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )
    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`)
    }

    // Check if the project can create secrets in the project
    await this.projectPermission.isProjectMaintainer(user, projectId)

    // Check if the secret exists
    const secret = await this.secretReposiotory.getSecret(secretId, projectId)
    if (!secret) {
      throw new NotFoundException(`Secret not found: ${secretId}`)
    }

    // Check if the secret already exists in the environment
    if (
      dto.name &&
      (await this.secretExists(
        user,
        dto.name,
        secret.environmentId,
        projectId
      )) &&
      secret.name !== dto.name
    ) {
      throw new ConflictException(
        `Secret already exists: ${dto.name} in environment ${secret.environmentId} in project ${projectId}`
      )
    }

    // Update the secret
    return await this.secretReposiotory.updateSecret(secretId, dto, user.id)
  }

  async updateSecretEnvironment(
    user: User,
    secretId: Secret['id'],
    environmentId: Environment['id'],
    projectId: Project['id']
  ) {
    // Fetch the project
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )
    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`)
    }

    // Check if the project can create secrets in the project
    await this.projectPermission.isProjectMaintainer(user, projectId)

    // Check if the secret exists
    const secret = await this.secretReposiotory.getSecret(secretId, projectId)
    if (!secret) {
      throw new NotFoundException(`Secret not found: ${secretId}`)
    }

    // Check if the environment exists
    const environment =
      await this.environmentRepository.getEnvironmentByProjectIdAndId(
        projectId,
        environmentId
      )
    if (!environment) {
      throw new NotFoundException(
        `Environment not found: ${environmentId} in project ${projectId}`
      )
    }

    // Check if the secret already exists in the environment
    if (
      (await this.secretExists(user, secret.name, environment.id, projectId)) &&
      secret.environmentId !== environment.id
    ) {
      throw new ConflictException(
        `Secret already exists: ${secret.name} in environment ${environment.id} in project ${projectId}`
      )
    }

    // Update the secret
    return await this.secretReposiotory.updateSecretEnvironment(
      secretId,
      environmentId,
      user.id
    )
  }

  async rollbackSecret(
    user: User,
    secretId: Secret['id'],
    rollbackVersion: SecretVersion['version'],
    projectId: Project['id']
  ) {
    // Fetch the project
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )
    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`)
    }

    // Check if the project can create secrets in the project
    await this.projectPermission.isProjectMaintainer(user, projectId)

    // Check if the secret exists
    const secret = (await this.secretReposiotory.getSecret(
      secretId,
      projectId
    )) as SecretWithVersion
    if (!secret) {
      throw new NotFoundException(`Secret not found: ${secretId}`)
    }

    // Check if the rollback version is valid
    if (rollbackVersion <= 1 || rollbackVersion > secret.versions[0].version) {
      throw new NotFoundException(
        `Invalid rollback version: ${rollbackVersion} for secret: ${secretId}`
      )
    }

    // Rollback the secret
    return await this.secretReposiotory.rollbackSecret(
      secretId,
      rollbackVersion
    )
  }

  async deleteSecret(
    user: User,
    secretId: Secret['id'],
    projectId: Project['id']
  ) {
    // Fetch the project
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )
    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`)
    }

    // Check if the project can create secrets in the project
    await this.projectPermission.isProjectMaintainer(user, projectId)

    // Check if the secret exists
    const secret = await this.secretReposiotory.getSecret(secretId, projectId)
    if (!secret) {
      throw new NotFoundException(`Secret not found: ${secretId}`)
    }

    // Delete the secret
    return await this.secretReposiotory.deleteSecret(secretId, user.id)
  }

  async getSecret(
    user: User,
    secretId: Secret['id'],
    projectId: Project['id'],
    decryptValue: boolean
  ) {
    // Fetch the project
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )
    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`)
    }

    // Fetch the secret
    const secret = (await this.secretReposiotory.getSecret(
      secretId,
      projectId
    )) as SecretWithVersion
    if (!secret) {
      throw new NotFoundException(`Secret not found: ${secretId}`)
    }

    // Check if the project is allowed to store the private key
    if (decryptValue && !project.storePrivateKey) {
      throw new BadRequestException(
        `Cannot decrypt secret value: ${secretId} as the project does not store the private key`
      )
    }

    // Check if the project has a private key. This is just to ensure that we don't run into any
    // problems while decrypting the secret
    if (decryptValue && !project.privateKey) {
      throw new NotFoundException(
        `Cannot decrypt secret value: ${secretId} as the project does not have a private key`
      )
    }

    if (decryptValue) {
      // Decrypt the secret value
      const decryptedValue = decrypt(
        project.privateKey,
        secret.versions[0].value
      )
      secret.versions[0].value = decryptedValue
    }

    // Return the secret
    return secret
  }

  async getAllVersionsOfSecret(
    user: User,
    secretId: Secret['id'],
    projectId: Project['id']
  ) {
    // Fetch the project
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )
    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`)
    }

    // Fetch the secret
    const secret = await this.secretReposiotory.getSecret(secretId, projectId)
    if (!secret) {
      throw new NotFoundException(`Secret not found: ${secretId}`)
    }

    // Return the secret versions
    return await this.secretReposiotory.getAllVersionsOfSecret(secretId)
  }

  async getAllSecretsOfProject(
    user: User,
    projectId: Project['id'],
    decryptValue: boolean,
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    // Fetch the project
    const project = await this.projectRepository.getProjectByUserIdAndId(
      user.id,
      projectId
    )
    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`)
    }

    // Check if the project is allowed to store the private key
    if (decryptValue && !project.storePrivateKey) {
      throw new BadRequestException(
        `Cannot decrypt secret values as the project does not store the private key`
      )
    }

    // Check if the project has a private key. This is just to ensure that we don't run into any
    // problems while decrypting the secret
    if (decryptValue && !project.privateKey) {
      throw new NotFoundException(
        `Cannot decrypt secret values as the project does not have a private key`
      )
    }

    const secrets = (await this.secretReposiotory.getAllSecretsOfProject(
      projectId,
      page,
      limit,
      sort,
      order,
      search
    )) as SecretWithVersion[]

    // Return the secrets
    return secrets.map((secret) => {
      if (decryptValue) {
        // Decrypt the secret value
        const decryptedValue = decrypt(
          project.privateKey,
          secret.versions[0].value
        )
        secret.versions[0].value = decryptedValue
      }
      return secret
    })
  }

  async getAllSecrets(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    // Return the secrets
    return await this.secretReposiotory.getAllSecrets(
      page,
      limit,
      sort,
      order,
      search
    )
  }
}
