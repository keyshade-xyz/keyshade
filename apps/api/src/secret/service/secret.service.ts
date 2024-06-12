import {
  BadRequestException,
  ConflictException,
  Inject,
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
import createEvent from '../../common/create-event'
import { RedisClientType } from 'redis'
import { REDIS_CLIENT } from '../../provider/redis.provider'
import { CHANGE_NOTIFIER_RSC } from '../../socket/change-notifier.socket'
import { AuthorityCheckerService } from '../../common/authority-checker.service'

@Injectable()
export class SecretService {
  private readonly logger = new Logger(SecretService.name)
  private readonly redis: RedisClientType

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT)
    readonly redisClient: {
      publisher: RedisClientType
    },
    private readonly authorityCheckerService: AuthorityCheckerService
  ) {
    this.redis = redisClient.publisher
  }

  async createSecret(user: User, dto: CreateSecret, projectId: Project['id']) {
    // Fetch the project
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: projectId },
        authority: Authority.CREATE_SECRET,
        prisma: this.prisma
      })

    // Check if the secret with the same name already exists in the project
    await this.secretExists(dto.name, projectId)

    // Check if the user has access to the environments
    if (dto.entries && dto.entries.length > 0) {
      const environmentIds = dto.entries.map((entry) => entry.environmentId)
      for (const environmentId of environmentIds) {
        await this.authorityCheckerService.checkAuthorityOverEnvironment({
          userId: user.id,
          entity: { id: environmentId },
          authority: Authority.READ_ENVIRONMENT,
          prisma: this.prisma
        })
      }
    }

    // Create the secret
    const secret = await this.prisma.secret.create({
      data: {
        name: dto.name,
        note: dto.note,
        rotateAt: addHoursToDate(dto.rotateAfter),
        versions: {
          createMany: {
            data: await Promise.all(
              dto.entries.map(async (entry) => ({
                value: await encrypt(project.publicKey, entry.value),
                version: 1,
                createdById: user.id,
                environmentId: entry.environmentId
              }))
            )
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
      },
      include: {
        project: {
          select: {
            workspaceId: true
          }
        },
        versions: {
          select: {
            environmentId: true,
            value: true
          }
        }
      }
    })

    await createEvent(
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
          projectName: project.name
        },
        workspaceId: project.workspaceId
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} created secret ${secret.id}`)

    return secret
  }

  async updateSecret(user: User, secretId: Secret['id'], dto: UpdateSecret) {
    const secret = await this.authorityCheckerService.checkAuthorityOverSecret({
      userId: user.id,
      entity: { id: secretId },
      authority: Authority.UPDATE_SECRET,
      prisma: this.prisma
    })

    // Check if the secret with the same name already exists in the project
    dto.name && (await this.secretExists(dto.name, secret.projectId))

    // Check if the user has access to the environments
    if (dto.entries && dto.entries.length > 0) {
      const environmentIds = dto.entries.map((entry) => entry.environmentId)
      for (const environmentId of environmentIds) {
        await this.authorityCheckerService.checkAuthorityOverEnvironment({
          userId: user.id,
          entity: { id: environmentId },
          authority: Authority.READ_ENVIRONMENT,
          prisma: this.prisma
        })
      }
    }

    const op = []

    // Update the secret

    // Update the other fields
    op.push(
      this.prisma.secret.update({
        where: {
          id: secret.id
        },
        data: {
          name: dto.name,
          note: dto.note,
          rotateAt: dto.rotateAfter
            ? addHoursToDate(dto.rotateAfter)
            : undefined,
          lastUpdatedById: user.id
        },
        include: {
          project: {
            select: {
              workspaceId: true
            }
          },
          versions: {
            select: {
              environmentId: true,
              value: true
            }
          }
        }
      })
    )

    // If new values for various environments are proposed,
    // we want to create new versions for those environments
    if (dto.entries && dto.entries.length > 0) {
      for (const entry of dto.entries) {
        // Fetch the latest version of the secret for the environment
        const latestVersion = await this.prisma.secretVersion.findFirst({
          where: {
            secretId: secret.id,
            environmentId: entry.environmentId
          },
          select: {
            version: true
          },
          orderBy: {
            version: 'desc'
          },
          take: 1
        })

        // Create the new version
        // Create the new version
        op.push(
          this.prisma.secretVersion.create({
            data: {
              value: await encrypt(secret.project.publicKey, entry.value),
              version: latestVersion ? latestVersion.version + 1 : 1,
              createdById: user.id,
              environmentId: entry.environmentId,
              secretId: secret.id
            }
          })
        )
      }
    }

    // Make the transaction
    const tx = await this.prisma.$transaction(op)
    const updatedSecret = tx[0]

    // Notify the new secret version through Redis
    if (dto.entries && dto.entries.length > 0) {
      for (const entry of dto.entries) {
        try {
          await this.redis.publish(
            CHANGE_NOTIFIER_RSC,
            JSON.stringify({
              environmentId: entry.environmentId,
              name: updatedSecret.name,
              value: entry.value,
              isSecret: true
            })
          )
        } catch (error) {
          this.logger.error(`Error publishing secret update to Redis: ${error}`)
        }
      }
    }

    await createEvent(
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
        },
        workspaceId: secret.project.workspaceId
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} updated secret ${secret.id}`)

    return updatedSecret
  }

  async rollbackSecret(
    user: User,
    secretId: Secret['id'],
    environmentId: Environment['id'],
    rollbackVersion: SecretVersion['version']
  ) {
    // Fetch the secret
    const secret = await this.authorityCheckerService.checkAuthorityOverSecret({
      userId: user.id,
      entity: { id: secretId },
      authority: Authority.UPDATE_SECRET,
      prisma: this.prisma
    })

    // Filter the secret versions by the environment
    secret.versions = secret.versions.filter(
      (version) => version.environmentId === environmentId
    )

    if (secret.versions.length === 0) {
      throw new NotFoundException(
        `No versions found for environment: ${environmentId} for secret: ${secretId}`
      )
    }

    // Sorting is in ascending order of dates. So the last element is the latest version
    const maxVersion = secret.versions[secret.versions.length - 1].version

    // Check if the rollback version is valid
    if (rollbackVersion < 1 || rollbackVersion >= maxVersion) {
      throw new NotFoundException(
        `Invalid rollback version: ${rollbackVersion} for secret: ${secretId}`
      )
    }

    // Rollback the secret
    const result = await this.prisma.secretVersion.deleteMany({
      where: {
        secretId: secret.id,
        version: {
          gt: Number(rollbackVersion)
        }
      }
    })

    try {
      await this.redis.publish(
        CHANGE_NOTIFIER_RSC,
        JSON.stringify({
          environmentId,
          name: secret.name,
          value: secret.versions[rollbackVersion - 1].value,
          isSecret: true
        })
      )
    } catch (error) {
      this.logger.error(`Error publishing secret update to Redis: ${error}`)
    }

    await createEvent(
      {
        triggeredBy: user,
        entity: secret,
        type: EventType.SECRET_UPDATED,
        source: EventSource.SECRET,
        title: `Secret rolled back`,
        metadata: {
          secretId: secret.id,
          name: secret.name,
          projectId: secret.projectId,
          projectName: secret.project.name
        },
        workspaceId: secret.project.workspaceId
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} rolled back secret ${secret.id}`)

    return result
  }

  async deleteSecret(user: User, secretId: Secret['id']) {
    // Check if the user has the required role
    const secret = await this.authorityCheckerService.checkAuthorityOverSecret({
      userId: user.id,
      entity: { id: secretId },
      authority: Authority.DELETE_SECRET,
      prisma: this.prisma
    })

    // Delete the secret
    await this.prisma.secret.delete({
      where: {
        id: secret.id
      }
    })

    await createEvent(
      {
        triggeredBy: user,
        type: EventType.SECRET_DELETED,
        source: EventSource.SECRET,
        entity: secret,
        title: `Secret deleted`,
        metadata: {
          secretId: secret.id
        },
        workspaceId: secret.project.workspaceId
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} deleted secret ${secret.id}`)
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
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: projectId },
        authority: Authority.READ_SECRET,
        prisma: this.prisma
      })

    // Check if the secret values can be decrypted
    await this.checkAutoDecrypt(decryptValue, project)

    const secrets = await this.prisma.secret.findMany({
      where: {
        projectId,
        name: {
          contains: search
        }
      },
      include: {
        lastUpdatedBy: {
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

    const secretsWithEnvironmentalValues = new Map<
      Secret['id'],
      {
        secret: Secret
        values: {
          environment: {
            name: Environment['name']
            id: Environment['id']
          }
          value: SecretVersion['value']
        }[]
      }
    >()

    // Find all the environments for this project
    const environments = await this.prisma.environment.findMany({
      where: {
        projectId
      }
    })
    const environmentIds = new Map(
      environments.map((env) => [env.id, env.name])
    )

    for (const secret of secrets) {
      // Make a copy of the environment IDs
      const envIds = new Map(environmentIds)
      let iterations = envIds.size

      // Find the latest version for each environment
      while (iterations--) {
        const latestVersion = await this.prisma.secretVersion.findFirst({
          where: {
            secretId: secret.id,
            environmentId: {
              in: Array.from(envIds.keys())
            }
          },
          orderBy: {
            version: 'desc'
          }
        })

        if (!latestVersion) continue

        if (secretsWithEnvironmentalValues.has(secret.id)) {
          secretsWithEnvironmentalValues.get(secret.id).values.push({
            environment: {
              id: latestVersion.environmentId,
              name: envIds.get(latestVersion.environmentId)
            },
            value: decryptValue
              ? await decrypt(project.privateKey, latestVersion.value)
              : latestVersion.value
          })
        } else {
          secretsWithEnvironmentalValues.set(secret.id, {
            secret,
            values: [
              {
                environment: {
                  id: latestVersion.environmentId,
                  name: envIds.get(latestVersion.environmentId)
                },
                value: decryptValue
                  ? await decrypt(project.privateKey, latestVersion.value)
                  : latestVersion.value
              }
            ]
          })
        }

        envIds.delete(latestVersion.environmentId)
      }
    }

    return Array.from(secretsWithEnvironmentalValues.values())
  }

  private async secretExists(
    secretName: Secret['name'],
    projectId: Project['id']
  ) {
    if (
      (await this.prisma.secret.findFirst({
        where: {
          name: secretName,
          projectId
        }
      })) !== null
    ) {
      throw new ConflictException(
        `Secret already exists: ${secretName} in project ${projectId}`
      )
    }
  }

  private async checkAutoDecrypt(decryptValue: boolean, project: Project) {
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
  }
}
