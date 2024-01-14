import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import {
  Environment,
  Project,
  Secret,
  SecretVersion,
  User
} from '@prisma/client'
import { CreateSecret } from '../dto/create.secret/create.secret'
import { ProjectPermission } from '../../project/misc/project.permission'
import { UpdateSecret } from '../dto/update.secret/update.secret'
import { decrypt } from '../../common/decrypt'
import { SecretWithVersion } from '../secret.types'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class SecretService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectPermission: ProjectPermission
  ) {}

  async createSecret(user: User, dto: CreateSecret, projectId: Project['id']) {
    const environmentId = dto.environmentId
    // Fetch the project
    const project = await this.getProjectByUserIdAndId(user.id, projectId)
    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`)
    }

    // Check if the project can create secrets in the project
    await this.projectPermission.isProjectMaintainer(user, projectId)

    // Check if the environment exists
    let environment: Environment | null = null
    if (environmentId) {
      environment = await this.getEnvironmentByProjectIdAndId(
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
      environment = await this.getDefaultEnvironmentOfProject(projectId)
    }

    // If any default environment was not found, throw an error
    if (!environment) {
      throw new NotFoundException(
        `No default environment found for project: ${projectId}`
      )
    }

    // Check if the secret already exists in the environment
    if (await this.secretExists(dto.name, environment.id, projectId, user.id)) {
      throw new ConflictException(
        `Secret already exists: ${dto.name} in environment ${environment.name} in project ${projectId}`
      )
    }

    // Create the secret
    return await this.prisma.secret.create({
      data: {
        name: dto.name,
        rotateAt: this.getRotateAt(dto.rotateAfter),
        versions: {
          create: {
            value: dto.value,
            version: 1,
            createdById: user.id
          }
        },
        environmentId,
        projectId,
        lastUpdatedById: user.id
      }
    })
  }

  async updateSecret(
    user: User,
    secretId: Secret['id'],
    dto: UpdateSecret,
    projectId: Project['id']
  ) {
    // Fetch the project
    const project = await this.getProjectByUserIdAndId(user.id, projectId)
    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`)
    }

    // Check if the project can create secrets in the project
    await this.projectPermission.isProjectMaintainer(user, projectId)

    // Check if the secret exists
    const secret = await this.getSecret(secretId, projectId)
    if (!secret) {
      throw new NotFoundException(`Secret not found: ${secretId}`)
    }

    // Check if the secret already exists in the environment
    if (
      dto.name &&
      (await this.secretExists(
        dto.name,
        secret.environmentId,
        projectId,
        user.id
      )) &&
      secret.name !== dto.name
    ) {
      throw new ConflictException(
        `Secret already exists: ${dto.name} in environment ${secret.environmentId} in project ${projectId}`
      )
    }

    // Update the secret
    if (dto.value) {
      const previousVersion = await this.prisma.secretVersion.findFirst({
        where: {
          secretId
        },
        select: {
          version: true
        },
        orderBy: {
          version: 'desc'
        },
        take: 1
      })

      return await this.prisma.secret.update({
        where: {
          id: secretId
        },
        data: {
          name: dto.name,
          rotateAt: this.getRotateAt(dto.rotateAfter),
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
    }

    return await this.prisma.secret.update({
      where: {
        id: secretId
      },
      data: {
        name: secret.name,
        rotateAt: secret.rotateAt,
        lastUpdatedById: user.id
      }
    })
  }

  async updateSecretEnvironment(
    user: User,
    secretId: Secret['id'],
    environmentId: Environment['id'],
    projectId: Project['id']
  ) {
    // Fetch the project
    const project = await this.getProjectByUserIdAndId(user.id, projectId)
    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`)
    }

    // Check if the project can create secrets in the project
    await this.projectPermission.isProjectMaintainer(user, projectId)

    // Check if the secret exists
    const secret = await this.getSecret(secretId, projectId)
    if (!secret) {
      throw new NotFoundException(`Secret not found: ${secretId}`)
    }

    // Check if the environment exists
    const environment = await this.getEnvironmentByProjectIdAndId(
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
      (await this.secretExists(
        secret.name,
        environment.id,
        projectId,
        user.id
      )) &&
      secret.environmentId !== environment.id
    ) {
      throw new ConflictException(
        `Secret already exists: ${secret.name} in environment ${environment.id} in project ${projectId}`
      )
    }

    // Update the secret
    return await this.prisma.secret.update({
      where: {
        id: secretId
      },
      data: {
        environmentId
      }
    })
  }

  async rollbackSecret(
    user: User,
    secretId: Secret['id'],
    rollbackVersion: SecretVersion['version'],
    projectId: Project['id']
  ) {
    // Fetch the project
    const project = await this.getProjectByUserIdAndId(user.id, projectId)
    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`)
    }

    // Check if the project can create secrets in the project
    await this.projectPermission.isProjectMaintainer(user, projectId)

    // Check if the secret exists
    const secret = (await this.getSecret(
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
    return await this.prisma.secretVersion.deleteMany({
      where: {
        secretId,
        version: {
          gt: rollbackVersion
        }
      }
    })
  }

  async deleteSecret(
    user: User,
    secretId: Secret['id'],
    projectId: Project['id']
  ) {
    // Fetch the project
    const project = await this.getProjectByUserIdAndId(user.id, projectId)
    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`)
    }

    // Check if the project can create secrets in the project
    await this.projectPermission.isProjectMaintainer(user, projectId)

    // Check if the secret exists
    const secret = await this.getSecret(secretId, projectId)
    if (!secret) {
      throw new NotFoundException(`Secret not found: ${secretId}`)
    }

    // Delete the secret
    return await this.prisma.secret.delete({
      where: {
        id: secretId
      }
    })
  }

  async getSecretById(
    user: User,
    secretId: Secret['id'],
    projectId: Project['id'],
    decryptValue: boolean
  ) {
    // Fetch the project
    const project = await this.getProjectByUserIdAndId(user.id, projectId)
    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`)
    }

    // Fetch the secret
    const secret = (await this.getSecret(
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
    const project = await this.getProjectByUserIdAndId(user.id, projectId)
    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`)
    }

    // Fetch the secret
    const secret = await this.getSecret(secretId, projectId)
    if (!secret) {
      throw new NotFoundException(`Secret not found: ${secretId}`)
    }

    // Return the secret versions
    return await this.prisma.secretVersion.findMany({
      where: {
        secretId
      }
    })
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
    const project = await this.getProjectByUserIdAndId(user.id, projectId)
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

    const secrets = (await this.prisma.secret.findMany({
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
        lastUpdatedBy: true,
        environment: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort]: order
      }
    })) as SecretWithVersion[]

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
    return await this.prisma.secret.findMany({
      where: {
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
        lastUpdatedBy: true,
        environment: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort]: order
      }
    })
  }

  private async getEnvironmentByProjectIdAndId(
    projectId: Project['id'],
    environmentId: Environment['id']
  ) {
    return await this.prisma.environment.findFirst({
      where: {
        projectId,
        id: environmentId
      }
    })
  }

  private async getDefaultEnvironmentOfProject(
    projectId: Project['id']
  ): Promise<Environment | null> {
    return await this.prisma.environment.findFirst({
      where: {
        projectId,
        isDefault: true
      }
    })
  }

  private async secretExists(
    secretName: Secret['name'],
    environmentId: Environment['id'],
    projectId: Project['id'],
    userId: User['id']
  ): Promise<boolean> {
    return (
      (await this.prisma.secret.count({
        where: {
          name: secretName,
          environment: {
            id: environmentId
          },
          projectId,
          project: {
            members: {
              some: {
                userId
              }
            }
          }
        }
      })) > 0
    )
  }

  private async getSecret(
    secretId: Secret['id'],
    projectId: Project['id']
  ): Promise<Secret> {
    return await this.prisma.secret.findUnique({
      where: {
        id: secretId,
        projectId
      },
      include: {
        versions: {
          orderBy: {
            version: 'desc'
          },
          take: 1
        },
        lastUpdatedBy: true,
        environment: true
      }
    })
  }

  private getRotateAt(rotateAfter: string): Date | undefined {
    if (!rotateAfter || rotateAfter === 'never') return undefined

    const rotateAt = new Date()
    rotateAt.setHours(rotateAt.getHours() + +rotateAfter)
    return rotateAt
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
