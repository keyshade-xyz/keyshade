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
import { PrismaService } from '@/prisma/prisma.service'
import { RedisClientType } from 'redis'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { CHANGE_NOTIFIER_RSC } from '@/socket/change-notifier.socket'
import { AuthorityCheckerService } from '@/common/authority-checker.service'
import {
  ChangeNotification,
  ChangeNotificationEvent
} from 'src/socket/socket.types'
import { paginate } from '@/common/paginate'
import { addHoursToDate, limitMaxItemsPerPage } from '@/common/util'
import generateEntitySlug from '@/common/slug-generator'
import { decrypt, encrypt } from '@/common/cryptography'
import { createEvent } from '@/common/event'
import { getEnvironmentIdToSlugMap } from '@/common/environment'

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

  async createSecret(
    user: User,
    dto: CreateSecret,
    projectSlug: Project['slug']
  ) {
    // Fetch the project
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: projectSlug },
        authorities: [Authority.CREATE_SECRET],
        prisma: this.prisma
      })
    const projectId = project.id

    // Check if the secret with the same name already exists in the project
    await this.secretExists(dto.name, project)

    const shouldCreateRevisions = dto.entries && dto.entries.length > 0

    // Check if the user has access to the environments
    const environmentSlugToIdMap = shouldCreateRevisions
      ? await getEnvironmentIdToSlugMap(
          dto,
          user,
          project,
          this.prisma,
          this.authorityCheckerService
        )
      : new Map<string, string>()

    // Create the secret
    const secret = await this.prisma.secret.create({
      data: {
        name: dto.name,
        slug: await generateEntitySlug(dto.name, 'SECRET', this.prisma),
        note: dto.note,
        rotateAt: addHoursToDate(dto.rotateAfter),
        versions: shouldCreateRevisions && {
          createMany: {
            data: await Promise.all(
              dto.entries.map(async (entry) => ({
                value: await encrypt(project.publicKey, entry.value),
                version: 1,
                createdById: user.id,
                environmentId: environmentSlugToIdMap.get(entry.environmentSlug)
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

  async updateSecret(
    user: User,
    secretSlug: Secret['slug'],
    dto: UpdateSecret
  ) {
    const secret = await this.authorityCheckerService.checkAuthorityOverSecret({
      userId: user.id,
      entity: { slug: secretSlug },
      authorities: [Authority.UPDATE_SECRET],
      prisma: this.prisma
    })

    const shouldCreateRevisions = dto.entries && dto.entries.length > 0

    // Check if the secret with the same name already exists in the project
    dto.name && (await this.secretExists(dto.name, secret.project))

    // Check if the user has access to the environments
    const environmentSlugToIdMap = shouldCreateRevisions
      ? await getEnvironmentIdToSlugMap(
          dto,
          user,
          secret.project,
          this.prisma,
          this.authorityCheckerService
        )
      : new Map<string, string>()

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
          slug: dto.name
            ? await generateEntitySlug(dto.name, 'SECRET', this.prisma)
            : undefined,
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
            environmentId: environmentSlugToIdMap.get(entry.environmentSlug)
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
              environmentId: environmentSlugToIdMap.get(entry.environmentSlug),
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
              environmentId: environmentSlugToIdMap.get(entry.environmentSlug),
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
    secretSlug: Secret['slug'],
    environmentSlug: Environment['slug'],
    rollbackVersion: SecretVersion['version']
  ) {
    // Fetch the secret
    const secret = await this.authorityCheckerService.checkAuthorityOverSecret({
      userId: user.id,
      entity: { slug: secretSlug },
      authorities: [Authority.UPDATE_SECRET],
      prisma: this.prisma
    })

    // Fetch the environment
    const environment =
      await this.authorityCheckerService.checkAuthorityOverEnvironment({
        userId: user.id,
        entity: { slug: environmentSlug },
        authorities: [Authority.UPDATE_SECRET],
        prisma: this.prisma
      })
    const environmentId = environment.id

    const project = secret.project

    // Filter the secret versions by the environment
    secret.versions = secret.versions.filter(
      (version) => version.environmentId === environmentId
    )

    if (secret.versions.length === 0) {
      throw new NotFoundException(
        `No versions found for environment: ${environmentSlug} for secret: ${secretSlug}`
      )
    }

    // Sorting is in ascending order of dates. So the last element is the latest version
    const maxVersion = secret.versions[secret.versions.length - 1].version

    // Check if the rollback version is valid
    if (rollbackVersion < 1 || rollbackVersion >= maxVersion) {
      throw new NotFoundException(
        `Invalid rollback version: ${rollbackVersion} for secret: ${secretSlug}`
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

  async deleteSecret(user: User, secretSlug: Secret['slug']) {
    // Check if the user has the required role
    const secret = await this.authorityCheckerService.checkAuthorityOverSecret({
      userId: user.id,
      entity: { slug: secretSlug },
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
    projectSlug: Project['slug'],
    environmentSlug: Environment['slug']
  ) {
    // Fetch the project
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: projectSlug },
        authorities: [Authority.READ_SECRET],
        prisma: this.prisma
      })
    const projectId = project.id

    // Check access to the environment
    const environment =
      await this.authorityCheckerService.checkAuthorityOverEnvironment({
        userId: user.id,
        entity: { slug: environmentSlug },
        authorities: [Authority.READ_ENVIRONMENT],
        prisma: this.prisma
      })
    const environmentId = environment.id

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
    secretSlug: Secret['slug'],
    environmentSlug: Environment['slug'],
    page: number,
    limit: number,
    order: 'asc' | 'desc' = 'desc'
  ) {
    // Fetch the secret
    const secret = await this.authorityCheckerService.checkAuthorityOverSecret({
      userId: user.id,
      entity: { slug: secretSlug },
      authorities: [Authority.READ_SECRET],
      prisma: this.prisma
    })
    const secretId = secret.id

    // Fetch the environment
    const environment =
      await this.authorityCheckerService.checkAuthorityOverEnvironment({
        userId: user.id,
        entity: { slug: environmentSlug },
        authorities: [Authority.READ_ENVIRONMENT],
        prisma: this.prisma
      })
    const environmentId = environment.id

    // Get the revisions
    const items = await this.prisma.secretVersion.findMany({
      where: {
        secretId: secretId,
        environmentId: environmentId
      },
      skip: page * limit,
      take: limitMaxItemsPerPage(limit),
      orderBy: {
        version: order
      }
    })

    const totalCount = await this.prisma.secretVersion.count({
      where: {
        secretId: secretId,
        environmentId: environmentId
      }
    })

    const metadata = paginate(totalCount, `/secret/${secretSlug}`, {
      page,
      limit: limitMaxItemsPerPage(limit),
      order
    })

    return { items, metadata }
  }

  async getAllSecretsOfProject(
    user: User,
    projectSlug: Project['slug'],
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
        entity: { slug: projectSlug },
        authorities: [Authority.READ_SECRET],
        prisma: this.prisma
      })
    const projectId = project.id

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

    // Calculate pagination metadata
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
      `/secret/${projectSlug}`,
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

  private async secretExists(secretName: Secret['name'], project: Project) {
    if (
      (await this.prisma.secret.findFirst({
        where: {
          name: secretName,
          projectId: project.id
        }
      })) !== null
    ) {
      throw new ConflictException(
        `Secret already exists: ${secretName} in project ${project.slug}`
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
