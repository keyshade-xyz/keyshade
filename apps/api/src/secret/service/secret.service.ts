import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import {
  Authority,
  Environment,
  EventSource,
  EventType,
  Project,
  Secret,
  SecretVersion,
  User
} from '@prisma/client'
import { CreateSecret } from '../dto/create.secret/create.secret'
import { UpdateSecret } from '../dto/update.secret/update.secret'
import { decrypt } from '../../common/decrypt'
import { PrismaService } from '../../prisma/prisma.service'
import { addHoursToDate } from '../../common/add-hours-to-date'
import { encrypt } from '../../common/encrypt'
import getProjectWithAuthority from '../../common/get-project-with-authority'
import getEnvironmentWithAuthority from '../../common/get-environment-with-authority'
import getSecretWithAuthority from '../../common/get-secret-with-authority'
import { SecretWithVersion } from '../secret.types'
import createEvent from '../../common/create-event'

@Injectable()
export class SecretService {
  private readonly logger = new Logger(SecretService.name)

  constructor(private readonly prisma: PrismaService) {}

  async createSecret(user: User, dto: CreateSecret, projectId: Project['id']) {
    const environmentId = dto.environmentId
    // Fetch the project
    const project = await getProjectWithAuthority(
      user.id,
      projectId,
      Authority.CREATE_SECRET,
      this.prisma
    )

    // Check if the environment exists
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
    const secret = await this.prisma.secret.create({
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

    createEvent(
      {
        triggeredBy: user,
        entity: secret,
        type: EventType.SECRET_ADDED,
        source: EventSource.SECRET,
        title: `Secret created`,
        metadata: {
          secretId: secret.id,
          name: secret.name,
          projectId,
          projectName: project.name,
          environmentId: environment.id,
          environmentName: environment.name
        }
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} created secret ${secret.id}`)

    return secret
  }

  async updateSecret(user: User, secretId: Secret['id'], dto: UpdateSecret) {
    const secret = await getSecretWithAuthority(
      user.id,
      secretId,
      Authority.UPDATE_SECRET,
      this.prisma
    )

    let result

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

      result = await this.prisma.secret.update({
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

    result = await this.prisma.secret.update({
      where: {
        id: secretId
      },
      data: {
        name: secret.name,
        rotateAt: secret.rotateAt,
        lastUpdatedById: user.id
      }
    })

    createEvent(
      {
        triggeredBy: user,
        entity: secret,
        type: EventType.SECRET_UPDATED,
        source: EventSource.SECRET,
        title: `Secret updated`,
        metadata: {
          secretId: secret.id,
          name: secret.name,
          projectId: secret.projectId,
          projectName: secret.project.name
        }
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} updated secret ${secret.id}`)

    return result
  }

  async updateSecretEnvironment(
    user: User,
    secretId: Secret['id'],
    environmentId: Environment['id']
  ) {
    const secret = await getSecretWithAuthority(
      user.id,
      secretId,
      Authority.UPDATE_SECRET,
      this.prisma
    )

    // Check if the environment exists
    const environment = await getEnvironmentWithAuthority(
      secret.projectId,
      environmentId,
      Authority.READ_ENVIRONMENT,
      this.prisma
    )

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
    const result = await this.prisma.secret.update({
      where: {
        id: secretId
      },
      data: {
        environmentId
      }
    })

    createEvent(
      {
        triggeredBy: user,
        entity: secret,
        type: EventType.SECRET_UPDATED,
        source: EventSource.SECRET,
        title: `Secret environment updated`,
        metadata: {
          secretId: secret.id,
          name: secret.name,
          projectId: secret.projectId,
          projectName: secret.project.name,
          environmentId: environment.id,
          environmentName: environment.name
        }
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} updated secret ${secret.id}`)

    return result
  }

  async rollbackSecret(
    user: User,
    secretId: Secret['id'],
    rollbackVersion: SecretVersion['version']
  ) {
    // Fetch the secret
    const secret = await getSecretWithAuthority(
      user.id,
      secretId,
      Authority.UPDATE_SECRET,
      this.prisma
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
    await getSecretWithAuthority(
      user.id,
      secretId,
      Authority.DELETE_SECRET,
      this.prisma
    )

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
    const secret = await getSecretWithAuthority(
      user.id,
      secretId,
      Authority.READ_SECRET,
      this.prisma
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
    const secret = await getSecretWithAuthority(
      user.id,
      secretId,
      Authority.READ_SECRET,
      this.prisma
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
    const project = await getProjectWithAuthority(
      user.id,
      projectId,
      Authority.READ_SECRET,
      this.prisma
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
}
