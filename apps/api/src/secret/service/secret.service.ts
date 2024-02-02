import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import {
  Environment,
  Project,
  Secret,
  SecretVersion,
  User,
  WorkspaceRole
} from '@prisma/client'
import { CreateSecret } from '../dto/create.secret/create.secret'
import { UpdateSecret } from '../dto/update.secret/update.secret'
import { decrypt } from '../../common/decrypt'
import { SecretWithProjectAndVersion, SecretWithVersion } from '../secret.types'
import { PrismaService } from '../../prisma/prisma.service'
import { addHoursToDate } from '../../common/add-hours-to-date'
import { encrypt } from '../../common/encrypt'
import permittedRoles from '../../common/get-permitted.roles'

@Injectable()
export class SecretService {
  constructor(private readonly prisma: PrismaService) {}

  async createSecret(user: User, dto: CreateSecret, projectId: Project['id']) {
    const environmentId = dto.environmentId
    // Fetch the project
    const project = await this.getProjectWithRole(
      user.id,
      projectId,
      WorkspaceRole.MAINTAINER
    )

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
    if (await this.secretExists(dto.name, environment.id)) {
      throw new ConflictException(
        `Secret already exists: ${dto.name} in environment ${environment.name} in project ${projectId}`
      )
    }

    // Create the secret
    return await this.prisma.secret.create({
      data: {
        name: dto.name,
        rotateAt: addHoursToDate(dto.rotateAfter),
        versions: {
          create: {
            value: encrypt(project.publicKey, dto.value),
            version: 1,
            createdById: user.id
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
  }

  async updateSecret(user: User, secretId: Secret['id'], dto: UpdateSecret) {
    const secret = await this.getSecretWithRole(
      user.id,
      secretId,
      WorkspaceRole.MAINTAINER
    )

    // Check if the secret already exists in the environment
    if (
      (dto.name && (await this.secretExists(dto.name, secret.environmentId))) ||
      secret.name === dto.name
    ) {
      throw new ConflictException(
        `Secret already exists: ${dto.name} in environment ${secret.environmentId}`
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
          rotateAt: addHoursToDate(dto.rotateAfter),
          lastUpdatedById: user.id,
          versions: {
            create: {
              value: encrypt(secret.project.publicKey, dto.value),
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
    environmentId: Environment['id']
  ) {
    const secret = await this.getSecretWithRole(
      user.id,
      secretId,
      WorkspaceRole.MAINTAINER
    )

    // Check if the environment exists
    const environment = await this.getEnvironmentByProjectIdAndId(
      secret.projectId,
      environmentId
    )
    if (!environment) {
      throw new NotFoundException(
        `Environment not found: ${environmentId} in project ${secret.projectId}`
      )
    }

    // Check if the secret already exists in the environment
    if (
      (await this.secretExists(secret.name, environment.id)) ||
      secret.environmentId !== environment.id
    ) {
      throw new ConflictException(
        `Secret already exists: ${secret.name} in environment ${environment.id} in project ${secret.projectId}`
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
    rollbackVersion: SecretVersion['version']
  ) {
    // Fetch the secret
    const secret = await this.getSecretWithRole(
      user.id,
      secretId,
      WorkspaceRole.MAINTAINER
    )

    // Check if the rollback version is valid
    if (rollbackVersion < 1 || rollbackVersion > secret.versions[0].version) {
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

  async deleteSecret(user: User, secretId: Secret['id']) {
    // Check if the user has the required role
    await this.getSecretWithRole(user.id, secretId, WorkspaceRole.MAINTAINER)

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
    decryptValue: boolean
  ) {
    // Fetch the secret
    const secret = await this.getSecretWithRole(
      user.id,
      secretId,
      WorkspaceRole.VIEWER
    )

    const project = secret.project

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

  async getAllVersionsOfSecret(user: User, secretId: Secret['id']) {
    // Fetch the secret
    const secret = await this.getSecretWithRole(
      user.id,
      secretId,
      WorkspaceRole.MAINTAINER
    )

    return secret.versions
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
    const project = await this.getProjectWithRole(
      user.id,
      projectId,
      WorkspaceRole.VIEWER
    )

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
    environmentId: Environment['id']
  ): Promise<boolean> {
    return (
      (await this.prisma.secret.count({
        where: {
          name: secretName,
          environment: {
            id: environmentId
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

  private async getSecretWithRole(
    userId: User['id'],
    secretId: Secret['id'],
    role: WorkspaceRole
  ): Promise<SecretWithProjectAndVersion> {
    // Fetch the secret
    const secret = await this.prisma.secret.findUnique({
      where: {
        id: secretId
      },
      include: {
        versions: true,
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

    if (!secret) {
      throw new NotFoundException(`Secret with id ${secretId} not found`)
    }

    // Check for the required membership role
    if (
      !secret.project.workspace.members.some(
        (member) =>
          member.userId === userId && permittedRoles(role).includes(role)
      )
    )
      throw new UnauthorizedException(
        `You don't have the required role to access this secret`
      )

    // Remove the workspace from the secret
    secret.project.workspace = undefined

    return secret
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
        (member) =>
          member.userId === userId && permittedRoles(role).includes(role)
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
