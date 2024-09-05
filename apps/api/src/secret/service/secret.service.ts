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
import { decrypt } from '@/common/decrypt'
import { PrismaService } from '@/prisma/prisma.service'
import { addHoursToDate } from '@/common/add-hours-to-date'
import { encrypt } from '@/common/encrypt'
import createEvent from '@/common/create-event'
import { RedisClientType } from 'redis'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { CHANGE_NOTIFIER_RSC } from '@/socket/change-notifier.socket'
import { AuthorityCheckerService } from '@/common/authority-checker.service'
import {
  ChangeNotification,
  ChangeNotificationEvent
} from 'src/socket/socket.types'
import { paginate } from '@/common/paginate'
import { limitMaxItemsPerPage } from '@/common/limit-max-items-per-page'

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
        authorities: [Authority.CREATE_SECRET],
        prisma: this.prisma
      })

    // Check if the secret with the same name already exists in the project
    await this.secretExists(dto.name, projectId)

    const shouldCreateRevisions = dto.entries && dto.entries.length > 0

    // Check if the user has access to the environments
    if (shouldCreateRevisions) {
      const environmentIds = dto.entries.map((entry) => entry.environmentId)
      await Promise.all(
        environmentIds.map(async (environmentId) => {
          const environment =
            await this.authorityCheckerService.checkAuthorityOverEnvironment({
              userId: user.id,
              entity: { id: environmentId },
              authorities: [Authority.READ_ENVIRONMENT],
              prisma: this.prisma
            })

          // Check if the environment belongs to the project
          if (environment.projectId !== projectId) {
            throw new BadRequestException(
              `Environment: ${environmentId} does not belong to project: ${projectId}`
            )
          }
        })
      )
    }

    // Create the secret
    const secret = await this.prisma.secret.create({
      data: {
        name: dto.name,
        note: dto.note,
        rotateAt: addHoursToDate(dto.rotateAfter),
        versions: shouldCreateRevisions && {
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
      authorities: [Authority.UPDATE_SECRET],
      prisma: this.prisma
    })

    const shouldCreateRevisions = dto.entries && dto.entries.length > 0

    // Check if the secret with the same name already exists in the project
    dto.name && (await this.secretExists(dto.name, secret.projectId))

    // Check if the user has access to the environments
    if (shouldCreateRevisions) {
      const environmentIds = dto.entries.map((entry) => entry.environmentId)
      await Promise.all(
        environmentIds.map(async (environmentId) => {
          const environment =
            await this.authorityCheckerService.checkAuthorityOverEnvironment({
              userId: user.id,
              entity: { id: environmentId },
              authorities: [Authority.READ_ENVIRONMENT],
              prisma: this.prisma
            })

          // Check if the environment belongs to the project
          if (environment.projectId !== secret.projectId) {
            throw new BadRequestException(
              `Environment: ${environmentId} does not belong to project: ${secret.projectId}`
            )
          }
        })
      )
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
        select: {
          id: true,
          name: true,
          note: true
        }
      })
    )

    // If new values for various environments are proposed,
    // we want to create new versions for those environments
    if (shouldCreateRevisions) {
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
        op.push(
          this.prisma.secretVersion.create({
            data: {
              value: await encrypt(secret.project.publicKey, entry.value),
              version: latestVersion ? latestVersion.version + 1 : 1,
              createdById: user.id,
              environmentId: entry.environmentId,
              secretId: secret.id
            },
            select: {
              id: true,
              environmentId: true,
              value: true,
              version: true
            }
          })
        )
      }
    }

    // Make the transaction
    const tx = await this.prisma.$transaction(op)
    const updatedSecret = tx[0]
    const updatedVersions = tx.slice(1)

    const result = {
      secret: updatedSecret,
      updatedVersions: updatedVersions
    }

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
              isPlaintext: true
            } as ChangeNotificationEvent)
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

    return result
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
      authorities: [Authority.UPDATE_SECRET],
      prisma: this.prisma
    })

    const project = secret.project

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
          value: project.storePrivateKey
            ? await decrypt(project.privateKey, secret.versions[0].value)
            : secret.versions[0].value,
          isPlaintext: project.storePrivateKey
        } as ChangeNotificationEvent)
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
      authorities: [Authority.DELETE_SECRET],
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

  async getAllSecretsOfProjectAndEnvironment(
    user: User,
    projectId: Project['id'],
    environmentId: Environment['id']
  ) {
    // Fetch the project
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: projectId },
        authorities: [Authority.READ_SECRET],
        prisma: this.prisma
      })

    // Check access to the environment
    await this.authorityCheckerService.checkAuthorityOverEnvironment({
      userId: user.id,
      entity: { id: environmentId },
      authorities: [Authority.READ_ENVIRONMENT],
      prisma: this.prisma
    })

    const secrets = await this.prisma.secret.findMany({
      where: {
        projectId,
        versions: {
          some: {
            environmentId
          }
        }
      },
      include: {
        lastUpdatedBy: {
          select: {
            id: true,
            name: true
          }
        },
        versions: {
          where: {
            environmentId
          },
          orderBy: {
            version: 'desc'
          },
          take: 1
        }
      }
    })

    const response: ChangeNotification[] = []

    for (const secret of secrets) {
      response.push({
        name: secret.name,
        value: project.storePrivateKey
          ? await decrypt(project.privateKey, secret.versions[0].value)
          : secret.versions[0].value,
        isPlaintext: project.storePrivateKey
      })
    }

    return response
  }
  async getRevisionsOfSecret(
    user: User,
    secretId: Secret['id'],
    environmentId: Environment['id'],
    page: number,
    limit: number,
    order: string
  ) {
    // assign order to variable dynamically
    const sortOrder = order === 'asc' ? 'asc' : 'desc'
    //check access to secret
    await this.authorityCheckerService.checkAuthorityOverSecret({
      userId: user.id,
      entity: { id: secretId },
      authorities: [Authority.READ_SECRET],
      prisma: this.prisma
    })

    await this.authorityCheckerService.checkAuthorityOverEnvironment({
      userId: user.id,
      entity: { id: environmentId },
      authorities: [Authority.READ_ENVIRONMENT],
      prisma: this.prisma
    })

    // get the revisions
    const revisions = await this.prisma.secretVersion.findMany({
      where: {
        secretId: secretId,
        environmentId: environmentId
      },
      skip: page * limit,
      take: limitMaxItemsPerPage(limit),
      orderBy: {
        version: sortOrder
      }
    })
    return revisions
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
        authorities: [Authority.READ_SECRET],
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
      take: limitMaxItemsPerPage(limit),

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
          version: SecretVersion['version']
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
              : latestVersion.value,
            version: latestVersion.version
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
                  : latestVersion.value,
                version: latestVersion.version
              }
            ]
          })
        }

        envIds.delete(latestVersion.environmentId)
      }
    }

    const items = Array.from(secretsWithEnvironmentalValues.values())

    //Calculate pagination metadata
    const totalCount = await this.prisma.secret.count({
      where: {
        projectId,
        name: {
          contains: search
        }
      }
    })

    const metadata = paginate(
      totalCount,
      `/secret/${projectId}`,
      {
        page,
        limit: limitMaxItemsPerPage(limit),
        sort,
        order,
        search
      },
      { decryptValue }
    )

    return { items, metadata }
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
