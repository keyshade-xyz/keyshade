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
  EventTriggerer,
  EventType,
  Project,
  Secret,
  SecretVersion,
  User
} from '@prisma/client'
import { CreateSecret } from '../dto/create.secret/create.secret'
import { UpdateSecret } from '../dto/update.secret/update.secret'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { RedisClientType } from 'redis'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { CHANGE_NOTIFIER_RSC } from '@/socket/change-notifier.socket'
import {
  ChangeNotification,
  ChangeNotificationEvent
} from '@/socket/socket.types'
import { paginate } from '@/common/paginate'
import {
  addHoursToDate,
  constructErrorBody,
  limitMaxItemsPerPage
} from '@/common/util'
import generateEntitySlug from '@/common/slug-generator'
import { decrypt, encrypt } from '@/common/cryptography'
import { createEvent } from '@/common/event'
import { getEnvironmentIdToSlugMap } from '@/common/environment'
import {
  getSecretWithValues,
  generateSecretValue,
  SecretWithValues
} from '@/common/secret'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SecretWithProject } from '../secret.types'
import { AuthenticatedUser } from '@/user/user.types'

@Injectable()
export class SecretService {
  private readonly logger = new Logger(SecretService.name)
  private readonly redis: RedisClientType

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    @Inject(REDIS_CLIENT)
    readonly redisClient: {
      publisher: RedisClientType
    }
  ) {
    this.redis = redisClient.publisher
  }

  /**
   * Creates a new secret in a project
   * @param user the user creating the secret
   * @param dto the secret data
   * @param projectSlug the slug of the project
   * @returns the created secret
   */
  async createSecret(
    user: AuthenticatedUser,
    dto: CreateSecret,
    projectSlug: Project['slug']
  ): Promise<SecretWithValues> {
    // Fetch the project
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        entity: { slug: projectSlug },
        authorities: [Authority.CREATE_SECRET]
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
          this.authorizationService
        )
      : new Map<string, string>()

    // Create the secret
    const secretData = await this.prisma.secret.create({
      data: {
        name: dto.name,
        slug: await generateEntitySlug(dto.name, 'SECRET', this.prisma),
        note: dto.note,
        rotateAt: addHoursToDate(dto.rotateAfter),
        rotateAfter: +dto.rotateAfter,
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
        lastUpdatedBy: {
          select: {
            id: true,
            name: true
          }
        },
        versions: {
          select: {
            environment: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            value: true,
            version: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                profilePictureUrl: true
              }
            },
            createdOn: true
          }
        }
      }
    })

    const secret = getSecretWithValues(secretData)

    await createEvent(
      {
        triggeredBy: user,
        entity: secret.secret,
        type: EventType.SECRET_ADDED,
        source: EventSource.SECRET,
        title: `Secret created`,
        metadata: {
          secretId: secret.secret.id,
          name: secret.secret.name,
          projectId,
          projectName: project.name
        },
        workspaceId: project.workspaceId
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} created secret ${secret.secret.id}`)

    return secret
  }

  /**
   * Updates a secret in a project
   * @param user the user performing the action
   * @param secretSlug the slug of the secret to update
   * @param dto the new secret data
   * @returns the updated secret and the updated versions
   */
  async updateSecret(
    user: AuthenticatedUser,
    secretSlug: Secret['slug'],
    dto: UpdateSecret
  ) {
    const secret = await this.authorizationService.authorizeUserAccessToSecret({
      user,
      entity: { slug: secretSlug },
      authorities: [Authority.UPDATE_SECRET]
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
          this.authorizationService
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
          ...(dto.rotateAfter
            ? {
                rotateAt: addHoursToDate(dto.rotateAfter),
                rotateAfter: +dto.rotateAfter
              }
            : {}),
          lastUpdatedById: user.id
        },
        select: {
          id: true,
          name: true,
          note: true,
          slug: true
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
              environment: {
                select: {
                  id: true,
                  slug: true
                }
              },
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

  /**
   * Rollback a secret to a specific version
   * @param user the user performing the action
   * @param secretSlug the slug of the secret to rollback
   * @param environmentSlug the slug of the environment to rollback
   * @param rollbackVersion the version to rollback to
   * @returns the deleted secret versions
   */
  async rollbackSecret(
    user: AuthenticatedUser,
    secretSlug: Secret['slug'],
    environmentSlug: Environment['slug'],
    rollbackVersion: SecretVersion['version']
  ) {
    // Fetch the secret
    const secret = await this.authorizationService.authorizeUserAccessToSecret({
      user,
      entity: { slug: secretSlug },
      authorities: [Authority.UPDATE_SECRET]
    })

    // Fetch the environment
    const environment =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        entity: { slug: environmentSlug },
        authorities: [Authority.UPDATE_SECRET]
      })
    const environmentId = environment.id

    const project = secret.project

    // Filter the secret versions by the environment
    secret.versions = secret.versions.filter(
      (version) => version.environmentId === environmentId
    )

    if (secret.versions.length === 0) {
      throw new NotFoundException(
        constructErrorBody(
          'No versions found for environment',
          `Secret ${secretSlug} has no versions for environment ${environmentSlug}`
        )
      )
    }

    // Sorting is in ascending order of dates. So the last element is the latest version
    const maxVersion = secret.versions[secret.versions.length - 1].version

    // Check if the rollback version is valid
    if (rollbackVersion < 1 || rollbackVersion >= maxVersion) {
      throw new NotFoundException(
        constructErrorBody(
          'Invalid rollback version',
          `Secret ${secretSlug} can not be rolled back to version ${rollbackVersion}`
        )
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

  /**
   * Deletes a secret from a project
   * @param user the user performing the action
   * @param secretSlug the slug of the secret to delete
   * @returns void
   */
  async deleteSecret(user: AuthenticatedUser, secretSlug: Secret['slug']) {
    // Check if the user has the required role
    const secret = await this.authorizationService.authorizeUserAccessToSecret({
      user,
      entity: { slug: secretSlug },
      authorities: [Authority.DELETE_SECRET]
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

  /**
   * Gets all revisions of a secret in an environment
   * @param user the user performing the action
   * @param secretSlug the slug of the secret
   * @param environmentSlug the slug of the environment
   * @param decryptValue whether to decrypt the secret values or not
   * @param page the page of items to return
   * @param limit the number of items to return per page
   * @param order the order of the items. Default is 'desc'
   * @returns an object with the items and the pagination metadata
   */
  async getRevisionsOfSecret(
    user: AuthenticatedUser,
    secretSlug: Secret['slug'],
    environmentSlug: Environment['slug'],
    decryptValue: boolean,
    page: number,
    limit: number,
    order: 'asc' | 'desc' = 'desc'
  ) {
    // Fetch the secret
    const secret = await this.authorizationService.authorizeUserAccessToSecret({
      user,
      entity: { slug: secretSlug },
      authorities: [Authority.READ_SECRET]
    })
    const secretId = secret.id

    // Fetch the environment
    const environment =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        entity: { slug: environmentSlug },
        authorities: [Authority.READ_ENVIRONMENT]
      })
    const environmentId = environment.id

    // Check if the secret can be decrypted
    await this.checkAutoDecrypt(decryptValue, secret.project)

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
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true
          }
        }
      }
    })

    // Decrypt the values
    if (decryptValue) {
      for (const item of items) {
        item.value = await decrypt(secret.project.privateKey, item.value)
      }
    }

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

  /**
   * Gets all secrets of a project
   * @param user the user performing the action
   * @param projectSlug the slug of the project
   * @param decryptValue whether to decrypt the secret values or not
   * @param page the page of items to return
   * @param limit the number of items to return per page
   * @param sort the field to sort the results by
   * @param order the order of the results
   * @param search the search query
   * @returns an object with the items and the pagination metadata
   */
  async getAllSecretsOfProject(
    user: AuthenticatedUser,
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
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        entity: { slug: projectSlug },
        authorities: [Authority.READ_SECRET]
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
            name: true,
            profilePictureUrl: true
          }
        },
        versions: {
          select: {
            value: true,
            version: true,
            environment: {
              select: {
                name: true,
                id: true,
                slug: true
              }
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                profilePictureUrl: true
              }
            },
            createdOn: true
          }
        }
      },
      skip: page * limit,
      take: limitMaxItemsPerPage(limit),

      orderBy: {
        [sort]: order
      }
    })

    const secretsWithEnvironmentalValues = new Set<{
      secret: Partial<Secret>
      values: {
        environment: {
          name: Environment['name']
          id: Environment['id']
          slug: Environment['slug']
        }
        value: SecretVersion['value']
        version: SecretVersion['version']
        createdBy: {
          id: User['id']
          name: User['name']
          profilePictureUrl: User['profilePictureUrl']
        }
        createdOn: SecretVersion['createdOn']
      }[]
    }>()

    for (const secret of secrets) {
      // Logic to update the map:
      // 1. If the environment ID is not present in the key, insert the environment ID and the secret version
      // 2. If the environment ID is already present, check if the existing secret version is lesser than the new secret version.
      //    If it is, update the secret version
      const envIdToSecretVersionMap = new Map<
        Environment['id'],
        Partial<SecretVersion> & {
          environment: {
            id: Environment['id']
            slug: Environment['slug']
            name: Environment['name']
          }
          createdBy: {
            id: User['id']
            name: User['name']
            profilePictureUrl: User['profilePictureUrl']
          }
        }
      >()

      for (const secretVersion of secret.versions) {
        const environmentId = secretVersion.environment.id
        const existingSecretVersion = envIdToSecretVersionMap.get(environmentId)

        if (!existingSecretVersion) {
          envIdToSecretVersionMap.set(environmentId, secretVersion)
        } else {
          if (existingSecretVersion.version < secretVersion.version) {
            envIdToSecretVersionMap.set(environmentId, secretVersion)
          }
        }
      }

      delete secret.versions

      // Add the secret to the map
      secretsWithEnvironmentalValues.add({
        secret,
        values: await Promise.all(
          Array.from(envIdToSecretVersionMap.values()).map(
            async (secretVersion) => ({
              environment: {
                id: secretVersion.environment.id,
                name: secretVersion.environment.name,
                slug: secretVersion.environment.slug
              },
              value: decryptValue
                ? await decrypt(project.privateKey, secretVersion.value)
                : secretVersion.value,
              version: secretVersion.version,
              createdBy: {
                id: secretVersion.createdBy.id,
                name: secretVersion.createdBy.name,
                profilePictureUrl: secretVersion.createdBy.profilePictureUrl
              },
              createdOn: secretVersion.createdOn
            })
          )
        )
      })
    }

    // console.log(secretsWithEnvironmentalValues)
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

  /**
   * Gets all secrets of a project and environment
   * @param user the user performing the action
   * @param projectSlug the slug of the project
   * @param environmentSlug the slug of the environment
   * @returns an array of objects with the secret name and value
   * @throws {NotFoundException} if the project or environment does not exist
   * @throws {BadRequestException} if the user does not have the required role
   */
  async getAllSecretsOfProjectAndEnvironment(
    user: AuthenticatedUser,
    projectSlug: Project['slug'],
    environmentSlug: Environment['slug']
  ) {
    // Fetch the project
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        entity: { slug: projectSlug },
        authorities: [Authority.READ_SECRET]
      })
    const projectId = project.id

    // Check access to the environment
    const environment =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        entity: { slug: environmentSlug },
        authorities: [Authority.READ_ENVIRONMENT]
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
          take: 1,
          include: {
            environment: {
              select: {
                id: true,
                slug: true
              }
            }
          }
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

  /**
   * Rotate values of secrets that have reached their rotation time
   * @param currentTime the current time
   */
  @Cron(CronExpression.EVERY_HOUR)
  async rotateSecrets(currentTime?: Date): Promise<void> {
    // Fetch all secrets that have reached their rotation time
    currentTime = currentTime ?? new Date()

    const secrets = await this.prisma.secret.findMany({
      where: {
        rotateAt: {
          lt: currentTime
        }
      },
      include: {
        project: true
      }
    })

    // Rotate secrets
    await Promise.all(secrets.map((secret) => this.rotateSecret(secret)))

    this.logger.log('Secrets rotated')
  }

  private async rotateSecret(secret: SecretWithProject): Promise<void> {
    const op = []

    // Update the secret
    op.push(
      this.prisma.secret.update({
        where: {
          id: secret.id
        },
        data: {
          rotateAt: addHoursToDate(secret.rotateAfter)
        },
        select: {
          name: true
        }
      })
    )

    // Fetch the latest version of the secret for all environments
    const latestEnvironmentVersions = await this.prisma.secretVersion.groupBy({
      where: {
        secretId: secret.id
      },
      by: ['environmentId'],
      _max: {
        version: true
      }
    })

    // Create new versions for all environments
    for (const latestEnvironmentVersion of latestEnvironmentVersions) {
      // Create the new version
      op.push(
        this.prisma.secretVersion.create({
          data: {
            value: await encrypt(
              secret.project.publicKey,
              generateSecretValue()
            ),
            version: latestEnvironmentVersion._max.version + 1,
            environmentId: latestEnvironmentVersion.environmentId,
            secretId: secret.id
          },
          select: {
            environment: {
              select: {
                id: true
              }
            },
            value: true
          }
        })
      )
    }

    // Make the transaction
    const tx = await this.prisma.$transaction(op)

    const updatedSecret = tx[0]
    const updatedVersions = tx.slice(1)

    // Notify the new secret version through Redis
    for (const updatedVersion of updatedVersions) {
      try {
        await this.redis.publish(
          CHANGE_NOTIFIER_RSC,
          JSON.stringify({
            environmentId: updatedVersion.environment.id,
            name: updatedSecret.name,
            value: updatedVersion.value,
            isPlaintext: true
          } as ChangeNotificationEvent)
        )
      } catch (error) {
        this.logger.error(`Error publishing secret update to Redis: ${error}`)
      }
    }

    await createEvent(
      {
        triggerer: EventTriggerer.SYSTEM,
        entity: secret,
        type: EventType.SECRET_UPDATED,
        source: EventSource.SECRET,
        title: `Secret rotated`,
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

    this.logger.log(`Secret ${secret.id} rotated`)
  }

  /**
   * Checks if a secret with a given name already exists in the project
   * @throws {ConflictException} if the secret already exists
   * @param secretName the name of the secret to check
   * @param project the project to check the secret in
   */
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
        constructErrorBody(
          'Secret already exists',
          `Secret ${secretName} already exists in project ${project.slug}`
        )
      )
    }
  }

  /**
   * Checks if the project is allowed to decrypt secret values
   * @param decryptValue whether to decrypt the secret values or not
   * @param project the project to check
   * @throws {BadRequestException} if the project does not store the private key and decryptValue is true
   * @throws {NotFoundException} if the project does not have a private key and decryptValue is true
   */
  private async checkAutoDecrypt(decryptValue: boolean, project: Project) {
    // Check if the project is allowed to store the private key
    if (decryptValue && !project.storePrivateKey) {
      throw new BadRequestException(
        constructErrorBody(
          'Cannot decrypt secret values',
          `Project ${project.slug} does not store the private key`
        )
      )
    }

    // Check if the project has a private key. This is just to ensure that we don't run into any
    // problems while decrypting the secret
    if (decryptValue && !project.privateKey) {
      throw new NotFoundException(
        constructErrorBody(
          'Cannot decrypt secret values',
          `Project ${project.slug} does not have a private key`
        )
      )
    }
  }
}
