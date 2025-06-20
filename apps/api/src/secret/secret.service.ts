import {
  BadRequestException,
  ConflictException,
  forwardRef,
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
import { CreateSecret } from './dto/create.secret/create.secret'
import { UpdateSecret } from './dto/update.secret/update.secret'
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
import { createEvent } from '@/common/event'
import { getEnvironmentIdToSlugMap } from '@/common/environment'
import { getSecretWithValues, generateSecretValue } from '@/common/secret'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SecretWithProject, SecretWithValues } from './secret.types'
import { AuthenticatedUser } from '@/user/user.types'
import { TierLimitService } from '@/common/tier-limit.service'
import SlugGenerator from '@/common/slug-generator.service'
import { VariableService } from '@/variable/variable.service'
import { decrypt, encrypt } from '@keyshade/common'

@Injectable()
export class SecretService {
  private readonly logger = new Logger(SecretService.name)
  private readonly redis: RedisClientType

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly tierLimitService: TierLimitService,
    private readonly slugGenerator: SlugGenerator,
    @Inject(forwardRef(() => VariableService))
    private readonly variableService: VariableService,
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
    this.logger.log(
      `User ${user.id} attempted to create a secret ${dto.name} in project ${projectSlug}`
    )

    // Fetch the project
    this.logger.log(
      `Checking if user has permissons to create secret in project ${projectSlug}`
    )
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        entity: { slug: projectSlug },
        authorities: [Authority.CREATE_SECRET]
      })
    const projectId = project.id

    // Check if more secrets can be created in the project
    await this.tierLimitService.checkSecretLimitReached(project)

    // Check if the secret with the same name already exists in the project
    await this.secretExists(dto.name, project)

    // Check if a variable with the same name already exists in the project
    await this.variableService.variableExists(dto.name, project)

    const shouldCreateRevisions = dto.entries && dto.entries.length > 0
    this.logger.log(
      `${dto.entries?.length || 0} revisions set for secret. Revision creation for secret ${dto.name} is set to ${shouldCreateRevisions}`
    )

    // Check if the user has access to the environments
    const environmentSlugToIdMap = shouldCreateRevisions
      ? await getEnvironmentIdToSlugMap(
          dto,
          user,
          project,
          this.authorizationService
        )
      : new Map<string, string>()

    // Create the secret
    this.logger.log(`Creating secret ${dto.name} in project ${projectSlug}`)
    const secretData = await this.prisma.secret.create({
      data: {
        name: dto.name,
        slug: await this.slugGenerator.generateEntitySlug(dto.name, 'SECRET'),
        note: dto.note,
        rotateAt: addHoursToDate(dto.rotateAfter),
        rotateAfter: +dto.rotateAfter,
        versions: shouldCreateRevisions
          ? {
              createMany: {
                data: await Promise.all(
                  dto.entries.map(async (entry) => ({
                    value: await encrypt(project.publicKey, entry.value),
                    version: 1,
                    createdById: user.id,
                    environmentId: environmentSlugToIdMap.get(
                      entry.environmentSlug
                    )
                  }))
                )
              }
            }
          : undefined,
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

    this.logger.log(`Secret ${dto.name} created in project ${projectSlug}`)

    const secret = await getSecretWithValues(
      secretData,
      project.storePrivateKey && project.privateKey !== null,
      project.privateKey
    )

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
    this.logger.log(`User ${user.id} attempted to update secret ${secretSlug}`)

    // Fetch the secret
    this.logger.log(
      `Checking if user has permissions to update secret ${secretSlug}`
    )
    const secret = await this.authorizationService.authorizeUserAccessToSecret({
      user,
      entity: { slug: secretSlug },
      authorities: [Authority.UPDATE_SECRET]
    })

    const shouldCreateRevisions = dto.entries && dto.entries.length > 0
    this.logger.log(
      `${dto.entries?.length || 0} revisions set for secret. Revision creation for secret ${dto.name} is set to ${shouldCreateRevisions}`
    )

    // Check if the secret with the same name already exists in the project
    dto.name && (await this.secretExists(dto.name, secret.project))

    // Check if a variable with the same name already exists in the project
    dto.name &&
      (await this.variableService.variableExists(dto.name, secret.project))

    // Check if the user has access to the environments
    const environmentSlugToIdMap = shouldCreateRevisions
      ? await getEnvironmentIdToSlugMap(
          dto,
          user,
          secret.project,
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
            ? await this.slugGenerator.generateEntitySlug(dto.name, 'SECRET')
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
        this.logger.log(
          `Fetching the latest version of secret ${secretSlug} for environment ${entry.environmentSlug}`
        )
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
        this.logger.log(
          `Latest version of secret ${secretSlug} for environment ${entry.environmentSlug} is ${latestVersion?.version}`
        )

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
              value: true,
              version: true,
              environment: {
                select: {
                  id: true,
                  slug: true,
                  name: true
                }
              },
              createdOn: true,
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  profilePictureUrl: true
                }
              }
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

    // Decrypt the secret values before sending only if one of the conditions are met:
    // 1. The user has requested to decrypt the secret values
    // 2. The project stores the private key OR
    // 3. The user has provided the private key
    if (
      dto.decryptValue &&
      ((secret.project.storePrivateKey && secret.project.privateKey) ||
        dto.privateKey)
    ) {
      for (const version of updatedVersions) {
        version.value = await decrypt(
          secret.project.privateKey ?? dto.privateKey,
          version.value
        )
      }
    }

    // Notify the new secret version through Redis
    if (dto.entries && dto.entries.length > 0) {
      for (const entry of dto.entries) {
        try {
          this.logger.log(
            `Publishing secret update to Redis for secret ${updatedSecret.slug} in environment ${entry.environmentSlug}`
          )
          await this.redis.publish(
            CHANGE_NOTIFIER_RSC,
            JSON.stringify({
              environmentId: environmentSlugToIdMap.get(entry.environmentSlug),
              name: updatedSecret.name,
              value: entry.value,
              isPlaintext: true
            } as ChangeNotificationEvent)
          )
          this.logger.log(
            `Published secret update to Redis for secret ${updatedSecret.slug} in environment ${entry.environmentSlug}`
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

  async deleteEnvironmentValueOfSecret(
    user: AuthenticatedUser,
    secretSlug: Secret['slug'],
    environmentSlug: Environment['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to delete environment value of secret ${secretSlug} in environment ${environmentSlug}`
    )

    // Fetch the environment
    this.logger.log(
      `Checking if user has permissions to delete environment value of secret ${secretSlug} in environment ${environmentSlug}`
    )
    const environment =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        entity: { slug: environmentSlug },
        authorities: [Authority.UPDATE_SECRET]
      })
    const environmentId = environment.id

    // Fetch the secret
    const secret = await this.authorizationService.authorizeUserAccessToSecret({
      user,
      entity: { slug: secretSlug },
      authorities: [Authority.UPDATE_SECRET]
    })

    // Delete the environment value of the secret
    this.logger.log(
      `Deleting environment value of secret ${secret.slug} in environment ${environment.slug}`
    )
    const count = await this.prisma.secretVersion.deleteMany({
      where: {
        secretId: secret.id,
        environmentId
      }
    })

    this.logger.log(
      `Deleted environment value of secret ${secret.slug} in environment ${environment.slug}. Deleted ${count.count} secret versions`
    )

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
    rollbackVersion: SecretVersion['version'],
    decryptValue: boolean
  ) {
    this.logger.log(
      `User ${user.id} attempted to rollback secret ${secretSlug} to version ${rollbackVersion}`
    )

    // Fetch the secret
    this.logger.log(
      `Checking if user has permissions to rollback secret ${secretSlug}`
    )
    const secret = await this.authorizationService.authorizeUserAccessToSecret({
      user,
      entity: { slug: secretSlug },
      authorities: [Authority.UPDATE_SECRET]
    })

    // Fetch the environment
    this.logger.log(
      `Checking if user has permissions to rollback secret ${secretSlug} in environment ${environmentSlug}`
    )
    const environment =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        entity: { slug: environmentSlug },
        authorities: [Authority.UPDATE_SECRET]
      })
    const environmentId = environment.id

    const project = secret.project

    // Filter the secret versions by the environment
    this.logger.log(
      `Fetching secret versions for secret ${secretSlug} in environment ${environmentSlug}`
    )
    secret.versions = secret.versions.filter(
      (version) => version.environment.id === environmentId
    )
    this.logger.log(
      `Found ${secret.versions.length} versions for secret ${secretSlug} in environment ${environmentSlug}`
    )

    if (secret.versions.length === 0) {
      const errorMessage = `Secret ${secretSlug} has no versions for environment ${environmentSlug}`
      this.logger.error(errorMessage)
      throw new NotFoundException(
        constructErrorBody('No versions found for environment', errorMessage)
      )
    }

    // Sorting is in ascending order of dates. So the last element is the latest version
    const maxVersion = secret.versions[secret.versions.length - 1].version
    this.logger.log(
      `Latest version of secret ${secretSlug} in environment ${environmentSlug} is ${maxVersion}. Rollback version is ${rollbackVersion}`
    )

    // Check if the rollback version is valid
    if (rollbackVersion < 1 || rollbackVersion >= maxVersion) {
      const errorMessage = `Secret ${secretSlug} can not be rolled back to version ${rollbackVersion}`
      this.logger.error(errorMessage)
      throw new NotFoundException(
        constructErrorBody('Invalid rollback version', errorMessage)
      )
    }

    // Rollback the secret
    this.logger.log(
      `Rolling back secret ${secretSlug} to version ${rollbackVersion}`
    )
    const result = await this.prisma.secretVersion.deleteMany({
      where: {
        secretId: secret.id,
        version: {
          gt: Number(rollbackVersion)
        }
      }
    })
    this.logger.log(
      `Rolled back secret ${secretSlug} to version ${rollbackVersion}`
    )

    try {
      this.logger.log(
        `Publishing secret update to Redis for secret ${secretSlug} in environment ${environmentSlug}`
      )
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
      this.logger.log(
        `Published secret update to Redis for secret ${secretSlug} in environment ${environmentSlug}`
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

    const currentRevision = secret.versions.find(
      (version) => version.version === rollbackVersion
    )!

    if (decryptValue && project.storePrivateKey) {
      currentRevision.value = await decrypt(
        project.privateKey,
        currentRevision.value
      )
    }

    return {
      ...result,
      currentRevision
    }
  }

  /**
   * Deletes a secret from a project
   * @param user the user performing the action
   * @param secretSlug the slug of the secret to delete
   * @returns void
   */
  async deleteSecret(user: AuthenticatedUser, secretSlug: Secret['slug']) {
    this.logger.log(`User ${user.id} attempted to delete secret ${secretSlug}`)

    // Check if the user has the required role
    this.logger.log(
      `Checking if user has permissions to delete secret ${secretSlug}`
    )
    const secret = await this.authorizationService.authorizeUserAccessToSecret({
      user,
      entity: { slug: secretSlug },
      authorities: [Authority.DELETE_SECRET]
    })

    // Delete the secret
    this.logger.log(`Deleting secret ${secretSlug}`)
    await this.prisma.secret.delete({
      where: {
        id: secret.id
      }
    })
    this.logger.log(`Deleted secret ${secretSlug}`)

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
    this.logger.log(
      `User ${user.id} attempted to get revisions of secret ${secretSlug} in environment ${environmentSlug}`
    )

    // Fetch the secret
    this.logger.log(
      `Checking if user has permissions to access secret ${secretSlug}`
    )
    const secret = await this.authorizationService.authorizeUserAccessToSecret({
      user,
      entity: { slug: secretSlug },
      authorities: [Authority.READ_SECRET]
    })
    const secretId = secret.id

    // Fetch the environment
    this.logger.log(
      `Checking if user has permissions to access environment ${environmentSlug}`
    )
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
    this.logger.log(
      `Fetching revisions of secret ${secretSlug} in environment ${environmentSlug}`
    )
    const items = await this.prisma.secretVersion.findMany({
      where: {
        secretId: secretId,
        environmentId: environmentId
      },
      select: {
        value: true,
        version: true,
        createdOn: true,
        environment: {
          select: {
            id: true,
            slug: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true
          }
        }
      },
      skip: page * limit,
      take: limitMaxItemsPerPage(limit),
      orderBy: {
        version: order
      }
    })
    this.logger.log(
      `Fetched ${items.length} revisions of secret ${secretSlug} in environment ${environmentSlug}`
    )

    // Decrypt the values
    if (decryptValue) {
      this.logger.log(`Decrypting values of secret ${secretSlug}`)
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
    this.logger.log(
      `User ${user.id} attempted to get all secrets of project ${projectSlug}`
    )

    // Fetch the project
    this.logger.log(
      `Checking if user has permissions to access project ${projectSlug}`
    )
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        entity: { slug: projectSlug },
        authorities: [Authority.READ_SECRET]
      })
    const projectId = project.id

    // Check if the secret values can be decrypted
    await this.checkAutoDecrypt(decryptValue, project)

    // Get the secrets
    this.logger.log(
      `Fetching all secrets of project ${projectSlug} with search query ${search}`
    )
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
    this.logger.log(
      `Fetched ${secrets.length} secrets of project ${projectSlug}`
    )

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
    this.logger.log('Rotating secrets')
    // Fetch all secrets that have reached their rotation time
    currentTime = currentTime ?? new Date()

    // Fetch all secrets that have reached their rotation time
    this.logger.log('Fetching secrets that have reached their rotation time')
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
    this.logger.log(
      `Fetched ${secrets.length} secrets that have reached their rotation time`
    )

    // Rotate secrets
    await Promise.all(secrets.map((secret) => this.rotateSecret(secret)))

    this.logger.log('Secrets rotation complete')
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
      this.logger.log(
        `Publishing secret update to Redis for secret ${updatedSecret.name} in environment ${updatedVersion.environment.id}`
      )
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
        this.logger.log(
          `Published secret update to Redis for secret ${updatedSecret.name} in environment ${
            updatedVersion.environment.id
          }`
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
  async secretExists(secretName: Secret['name'], project: Project) {
    this.logger.log(
      `Checking if secret ${secretName} exists in project ${project.slug}`
    )

    if (
      (await this.prisma.secret.findFirst({
        where: {
          name: secretName,
          projectId: project.id
        }
      })) !== null
    ) {
      const errorMessage = `Secret ${secretName} already exists in project ${project.slug}`
      this.logger.error(errorMessage)
      throw new ConflictException(
        constructErrorBody('Secret already exists', errorMessage)
      )
    }
    this.logger.log(
      `Secret ${secretName} does not exist in project ${project.slug}`
    )
  }

  /**
   * Checks if the project is allowed to decrypt secret values
   * @param decryptValue whether to decrypt the secret values or not
   * @param project the project to check
   * @throws {BadRequestException} if the project does not store the private key and decryptValue is true
   * @throws {NotFoundException} if the project does not have a private key and decryptValue is true
   */
  private async checkAutoDecrypt(decryptValue: boolean, project: Project) {
    this.logger.log(
      `Checking if secret values can be decrypted for project ${project.slug}`
    )

    if (decryptValue) {
      // Check if the project is allowed to store the private key
      if (!project.storePrivateKey) {
        const errorMessage = `Project ${project.slug} does not store the private key`
        this.logger.error(errorMessage)
        throw new BadRequestException(
          constructErrorBody('Can not decrypt secret values', errorMessage)
        )
      }

      // Check if the project has a private key. This is just to ensure that we don't run into any
      // problems while decrypting the secret
      if (!project.privateKey) {
        const errorMessage = `Project ${project.slug} does not have a private key`
        this.logger.error(errorMessage)
        throw new NotFoundException(
          constructErrorBody('Can not decrypt secret values', errorMessage)
        )
      }
    }

    this.logger.log(
      `Secret values can be decrypted for project ${project.slug}`
    )
  }
}
