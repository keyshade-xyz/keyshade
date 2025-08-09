import {
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
  SecretVersion
} from '@prisma/client'
import { CreateSecret } from './dto/create.secret/create.secret'
import { UpdateSecret } from './dto/update.secret/update.secret'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthorizationService } from '@/auth/service/authorization.service'
import { RedisClientType } from 'redis'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { CHANGE_NOTIFIER_RSC } from '@/socket/change-notifier.socket'
import { Configuration, ChangeNotificationEvent } from '@/socket/socket.types'
import { paginate, PaginatedResponse } from '@/common/paginate'
import {
  addHoursToDate,
  constructErrorBody,
  limitMaxItemsPerPage,
  mapEntriesToEventMetadata
} from '@/common/util'
import { createEvent } from '@/common/event'
import { getEnvironmentIdToSlugMap } from '@/common/environment'
import { generateSecretValue } from '@/common/secret'
import { Cron, CronExpression } from '@nestjs/schedule'
import { HydratedSecret, RawSecret, SecretRevision } from './secret.types'
import { AuthenticatedUser } from '@/user/user.types'
import { TierLimitService } from '@/common/tier-limit.service'
import SlugGenerator from '@/common/slug-generator.service'
import { VariableService } from '@/variable/variable.service'
import { decrypt, encrypt, sDecrypt } from '@/common/cryptography'
import {
  ConfigurationAddedEventMetadata,
  ConfigurationDeletedEventMetadata,
  ConfigurationUpdatedEventMetadata
} from '@/event/event.types'
import { InclusionQuery } from '@/common/inclusion-query'
import { HydrationService } from '@/common/hydration.service'

@Injectable()
export class SecretService {
  private readonly logger = new Logger(SecretService.name)
  private readonly redis: RedisClientType

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly tierLimitService: TierLimitService,
    private readonly slugGenerator: SlugGenerator,
    private readonly hydrationService: HydrationService,
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
  ): Promise<HydratedSecret> {
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
        slug: projectSlug,
        authorities: [Authority.CREATE_SECRET]
      })
    const projectId = project.id

    // Check if more secrets can be created in the project
    await this.tierLimitService.checkSecretLimitReached(project)

    // Check if the secret with the same name already exists in the project
    await this.secretExists(dto.name, project.id)

    // Check if a variable with the same name already exists in the project
    await this.variableService.variableExists(dto.name, project.id)

    const shouldCreateRevisions = dto.entries && dto.entries.length > 0
    this.logger.log(
      `${dto.entries?.length || 0} revisions set for secret. Revision creation for secret ${dto.name} is set to ${shouldCreateRevisions}`
    )

    // Check if the user has access to the environments
    const environmentSlugToIdMap = await getEnvironmentIdToSlugMap(
      dto,
      user,
      project,
      this.authorizationService,
      shouldCreateRevisions
    )

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
      include: InclusionQuery.Secret
    })

    this.logger.log(`Secret ${dto.name} created in project ${projectSlug}`)

    const hydratedSecret = await this.hydrationService.hydrateSecret({
      secret: secretData,
      user,
      authorizationService: this.authorizationService
    })

    if (dto.entries && dto.entries.length > 0) {
      try {
        for (const { environmentSlug, value } of dto.entries) {
          this.logger.log(
            `Publishing secret creation to Redis for secret ${hydratedSecret.slug} in environment ${environmentSlug}`
          )
          await this.redis.publish(
            CHANGE_NOTIFIER_RSC,
            JSON.stringify({
              environmentId: environmentSlugToIdMap.get(environmentSlug),
              name: dto.name,
              value,
              isPlaintext: true
            } as ChangeNotificationEvent)
          )
          this.logger.log(
            `Published secret update to Redis for secret ${hydratedSecret.slug} in environment ${environmentSlug}`
          )
        }
      } catch (error) {
        this.logger.error(`Error publishing secret update to Redis: ${error}`)
      }
    }

    await createEvent(
      {
        triggeredBy: user,
        entity: hydratedSecret,
        type: EventType.SECRET_ADDED,
        source: EventSource.SECRET,
        title: `Secret created`,
        metadata: {
          name: hydratedSecret.name,
          description: hydratedSecret.note,
          values: mapEntriesToEventMetadata(dto.entries),
          isSecret: true,
          isPlaintext: true
        } as ConfigurationAddedEventMetadata,
        workspaceId: project.workspaceId
      },
      this.prisma
    )

    delete hydratedSecret.project
    return hydratedSecret
  }

  async bulkCreateSecrets(
    user: AuthenticatedUser,
    projectSlug: string,
    secrets: CreateSecret[]
  ): Promise<{
    successful: HydratedSecret[]
    failed: Array<{ name: string; error: string }>
  }> {
    this.logger.log(
      `User ${user.id} initiated bulk creation of ${secrets.length} secrets in project ${projectSlug}`
    )

    const successful: HydratedSecret[] = []
    const failed: Array<{ name: string; error: string }> = []

    for (const secret of secrets) {
      try {
        const result = await this.createSecret(user, secret, projectSlug)
        successful.push(result)
      } catch (err) {
        this.logger.error(
          `Error creating secret "${secret.name}": ${err.message}`
        )
        failed.push({ name: secret.name, error: err.message })
      }
    }

    return { successful, failed }
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
  ): Promise<HydratedSecret> {
    this.logger.log(`User ${user.id} attempted to update secret ${secretSlug}`)

    // Fetch the secret
    this.logger.log(
      `Checking if user has permissions to update secret ${secretSlug}`
    )
    const secret = await this.authorizationService.authorizeUserAccessToSecret({
      user,
      slug: secretSlug,
      authorities: [Authority.UPDATE_SECRET]
    })

    const shouldCreateRevisions = dto.entries && dto.entries.length > 0
    this.logger.log(
      `${dto.entries?.length || 0} revisions set for secret. Revision creation for secret ${secret.name} is set to ${shouldCreateRevisions}`
    )

    // Check if the secret with the same name already exists in the project
    await this.secretExists(dto.name, secret.projectId)

    // Check if a variable with the same name already exists in the project
    await this.variableService.variableExists(dto.name, secret.projectId)

    // Check if the user has access to the environments
    const environmentSlugToIdMap = await getEnvironmentIdToSlugMap(
      dto,
      user,
      secret.project,
      this.authorizationService,
      shouldCreateRevisions
    )

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
          slug: await this.slugGenerator.generateEntitySlug(dto.name, 'SECRET'),
          note: dto.note,
          ...(dto.rotateAfter
            ? {
                rotateAt: addHoursToDate(dto.rotateAfter),
                rotateAfter: +dto.rotateAfter
              }
            : {}),
          lastUpdatedById: user.id
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
            }
          })
        )
      }
    }

    // Make the transaction
    await this.prisma.$transaction(op)

    const updatedSecret = await this.prisma.secret.findUnique({
      where: {
        id: secret.id
      },
      include: InclusionQuery.Secret
    })

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
          oldName: secret.name,
          newName: updatedSecret.name,
          description: updatedSecret.note,
          values: mapEntriesToEventMetadata(dto.entries),
          isPlaintext: true,
          isSecret: true
        } as ConfigurationUpdatedEventMetadata,
        workspaceId: secret.project.workspaceId
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} updated secret ${secret.id}`)

    return await this.hydrationService.hydrateSecret({
      secret: updatedSecret,
      user,
      authorizationService: this.authorizationService
    })
  }

  /**
   * Deletes the value of a secret for a specific environment.
   *
   * @param user The authenticated user performing the action.
   * @param secretSlug The slug identifier of the secret.
   * @param environmentSlug The slug identifier of the environment.
   *
   * This method verifies the user's permissions to modify the secret in the specified environment.
   * It deletes all secret versions associated with the environment and logs the operation.
   * Additionally, it creates an event to track the deletion action.
   */
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
        slug: environmentSlug,
        authorities: [Authority.UPDATE_SECRET]
      })
    const environmentId = environment.id

    // Fetch the secret
    const secret = await this.authorizationService.authorizeUserAccessToSecret({
      user,
      slug: secretSlug,
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
        type: EventType.SECRET_DELETED,
        source: EventSource.SECRET,
        title: `Secret updated`,
        metadata: {
          name: secret.name,
          environments: [environmentSlug]
        } as ConfigurationDeletedEventMetadata,
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
    rollbackVersion: SecretVersion['version']
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
      slug: secretSlug,
      authorities: [Authority.UPDATE_SECRET]
    })

    // Fetch the environment
    this.logger.log(
      `Checking if user has permissions to rollback secret ${secretSlug} in environment ${environmentSlug}`
    )
    const environment =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        slug: environmentSlug,
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

    let maxVersion = 0
    for (const element of secret.versions) {
      if (element.version > maxVersion) {
        maxVersion = element.version
      }
    }
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

    const secretValue = secret.versions[rollbackVersion - 1].value
    const canBeDecrypted =
      project.storePrivateKey &&
      project.privateKey !== null &&
      project.privateKey !== undefined
    const plainTextValue = canBeDecrypted
      ? await decrypt(sDecrypt(project.privateKey), secretValue)
      : null
    const ultimateSecretValue = canBeDecrypted ? plainTextValue : secretValue

    try {
      this.logger.log(
        `Publishing secret update to Redis for secret ${secretSlug} in environment ${environmentSlug}`
      )

      await this.redis.publish(
        CHANGE_NOTIFIER_RSC,
        JSON.stringify({
          environmentId,
          name: secret.name,
          value: ultimateSecretValue,
          isPlaintext: canBeDecrypted
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
          oldName: secret.name,
          newName: secret.name,
          values: {
            [environment.slug]: ultimateSecretValue
          },
          isPlaintext: canBeDecrypted,
          isSecret: true
        } as ConfigurationUpdatedEventMetadata,
        workspaceId: secret.project.workspaceId
      },
      this.prisma
    )

    const currentRevision = secret.versions.find(
      (version) => version.version === rollbackVersion
    )

    return {
      ...result,
      currentRevision
    }
  }

  /**
   * Disables a secret in a given environment
   * @param user the user performing the action
   * @param secretSlug the slug of the secret to disable
   * @param environmentSlug the slug of the environment in which the secret will be disabled
   * @returns void
   */
  async disableSecret(
    user: AuthenticatedUser,
    secretSlug: Secret['slug'],
    environmentSlug: Environment['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to disable secret ${secretSlug} in environment ${environmentSlug}`
    )

    // Fetch the environment
    this.logger.log(
      `Checking if user has permissions to disable secret ${secretSlug} in environment ${environmentSlug}`
    )
    const environment =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        slug: environmentSlug,
        authorities: [Authority.UPDATE_SECRET]
      })

    // Fetch the secret
    const secret = await this.authorizationService.authorizeUserAccessToSecret({
      user,
      slug: secretSlug,
      authorities: [Authority.UPDATE_SECRET]
    })

    // Disable the secret if not already disabled
    await this.prisma.disabledEnvironmentOfSecret.upsert({
      where: {
        secretId_environmentId: {
          secretId: secret.id,
          environmentId: environment.id
        }
      },
      update: {},
      create: {
        secretId: secret.id,
        environmentId: environment.id
      }
    })

    this.logger.log(
      `Disabled secret ${secretSlug} in environment ${environmentSlug}`
    )
  }

  /**
   * Enables a secret in a given environment
   * @param user the user performing the action
   * @param secretSlug the slug of the secret to enable
   * @param environmentSlug the slug of the environment in which the secret will be enabled
   * @returns void
   */
  async enableSecret(
    user: AuthenticatedUser,
    secretSlug: Secret['slug'],
    environmentSlug: Environment['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to enable secret ${secretSlug} in environment ${environmentSlug}`
    )

    // Fetch the environment
    this.logger.log(
      `Checking if user has permissions to enable secret ${secretSlug} in environment ${environmentSlug}`
    )
    const environment =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        slug: environmentSlug,
        authorities: [Authority.UPDATE_SECRET]
      })

    // Fetch the secret
    const secret = await this.authorizationService.authorizeUserAccessToSecret({
      user,
      slug: secretSlug,
      authorities: [Authority.UPDATE_SECRET]
    })

    // Enable the secret
    try {
      await this.prisma.disabledEnvironmentOfSecret.delete({
        where: {
          secretId_environmentId: {
            secretId: secret.id,
            environmentId: environment.id
          }
        }
      })
    } catch (error) {
      if (error.code === 'P2025') {
        this.logger.log(
          `Secret ${secretSlug} is not disabled in ${environmentSlug}`
        )
      } else {
        this.logger.error(`Error disabling secret ${secretSlug}`)
        throw error
      }
    }

    this.logger.log(
      `Enabled secret ${secretSlug} in environment ${environmentSlug}`
    )
  }

  /**
   * Gets all disabled environments of a secret
   * @param user the user performing the action
   * @param secretSlug the slug of the secret
   * @returns an array of environment IDs where the secret is disabled
   */
  async getAllDisabledEnvironmentsOfSecret(
    user: AuthenticatedUser,
    secretSlug: Secret['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to get all disabled environments of secret ${secretSlug}`
    )

    // Fetch the secret
    const secret = await this.authorizationService.authorizeUserAccessToSecret({
      user,
      slug: secretSlug,
      authorities: [Authority.READ_SECRET]
    })

    const secretId = secret.id

    // Get the environments
    const environments = await this.prisma.environment.findMany({
      where: {
        disabledEnvironmentOfSecret: {
          some: {
            secretId
          }
        }
      },
      select: {
        id: true
      }
    })

    return environments.map((env) => env.id)
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
      slug: secretSlug,
      authorities: [Authority.DELETE_SECRET]
    })

    const secretVersionEnvironments = new Set<Environment['slug']>()
    for (const version of secret.versions) {
      secretVersionEnvironments.add(version.environment.slug)
    }

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
          name: secret.name,
          environments: Array.from(secretVersionEnvironments)
        } as ConfigurationDeletedEventMetadata,
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
   * @param page the page of items to return
   * @param limit the number of items to return per page
   * @param order the order of the items. Default is 'desc'
   * @returns an object with the items and the pagination metadata
   */
  async getRevisionsOfSecret(
    user: AuthenticatedUser,
    secretSlug: Secret['slug'],
    environmentSlug: Environment['slug'],
    page: number,
    limit: number,
    order: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResponse<SecretRevision>> {
    this.logger.log(
      `User ${user.id} attempted to get revisions of secret ${secretSlug} in environment ${environmentSlug}`
    )

    // Fetch the secret
    this.logger.log(
      `Checking if user has permissions to access secret ${secretSlug}`
    )
    const secret = await this.authorizationService.authorizeUserAccessToSecret({
      user,
      slug: secretSlug,
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
        slug: environmentSlug,
        authorities: [Authority.READ_ENVIRONMENT]
      })
    const environmentId = environment.id

    // Get the revisions
    this.logger.log(
      `Fetching revisions of secret ${secretSlug} in environment ${environmentSlug}`
    )
    const items = await this.prisma.secretVersion.findMany({
      where: {
        secretId: secretId,
        environmentId: environmentId
      },
      select: InclusionQuery.Secret['versions']['select'],
      skip: page * limit,
      take: limitMaxItemsPerPage(limit),
      orderBy: {
        version: order
      }
    })
    this.logger.log(
      `Fetched ${items.length} revisions of secret ${secretSlug} in environment ${environmentSlug}`
    )

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
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<PaginatedResponse<HydratedSecret>> {
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
        slug: projectSlug,
        authorities: [Authority.READ_SECRET]
      })
    const projectId = project.id

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
      include: InclusionQuery.Secret,
      skip: page * limit,
      take: limitMaxItemsPerPage(limit),
      orderBy: {
        [sort]: order
      }
    })
    this.logger.log(
      `Fetched ${secrets.length} secrets of project ${projectSlug}`
    )

    const hydratedSecrets: HydratedSecret[] = []

    for (const secret of secrets) {
      const hydratedSecret = await this.hydrationService.hydrateSecret({
        user,
        secret,
        authorizationService: this.authorizationService
      })

      delete secret.project
      hydratedSecrets.push(hydratedSecret)
    }
    this.logger.log(
      `Hydrated ${hydratedSecrets.length} secrets of project ${projectSlug}`
    )

    // Calculate pagination metadata
    const totalCount = await this.prisma.secret.count({
      where: {
        projectId,
        name: {
          contains: search
        }
      }
    })

    const metadata = paginate(totalCount, `/secret/${projectSlug}`, {
      page,
      limit: limitMaxItemsPerPage(limit),
      sort,
      order,
      search
    })

    return { items: hydratedSecrets, metadata }
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
  ): Promise<Configuration[]> {
    this.logger.log(
      `User ${user.id} attempted to get all secrets of project ${projectSlug} and environment ${environmentSlug}`
    )

    // Fetch the project
    const project =
      await this.authorizationService.authorizeUserAccessToProject({
        user,
        slug: projectSlug,
        authorities: [Authority.READ_SECRET]
      })
    const projectId = project.id

    // Check access to the environment
    const environment =
      await this.authorizationService.authorizeUserAccessToEnvironment({
        user,
        slug: environmentSlug,
        authorities: [Authority.READ_ENVIRONMENT]
      })
    const environmentId = environment.id

    this.logger.log(
      `User ${user.id} has access to project ${projectSlug} and environment ${environmentSlug}`
    )

    // Fetch the secrets
    this.logger.log(
      `Fetching secrets of project ${projectSlug} and environment ${environmentSlug}`
    )
    const secrets = await this.prisma.secret.findMany({
      where: {
        projectId,
        versions: {
          some: {
            environmentId
          }
        },
        // Ignore disabled secrets
        disabledEnvironmentOfSecret: {
          none: {
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
                name: true,
                slug: true
              }
            }
          }
        }
      }
    })
    this.logger.log(
      `Fetched ${secrets.length} secrets of project ${projectSlug} and environment ${environmentSlug}`
    )

    const response: Configuration[] = []

    for (const secret of secrets) {
      response.push({
        name: secret.name,
        value: secret.versions[0].value
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
      include: InclusionQuery.Secret
    })
    this.logger.log(
      `Fetched ${secrets.length} secrets that have reached their rotation time`
    )

    // Rotate secrets
    await Promise.all(secrets.map((secret) => this.rotateSecret(secret)))

    this.logger.log('Secrets rotation complete')
  }

  private async rotateSecret(secret: RawSecret): Promise<void> {
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
            isPlaintext: false
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
  async secretExists(
    secretName: Secret['name'] | null | undefined,
    projectId: Project['id']
  ) {
    if (!secretName) return

    this.logger.log(
      `Checking if secret ${secretName} exists in project ${projectId}`
    )

    if (
      (await this.prisma.secret.findFirst({
        where: {
          name: secretName,
          projectId
        }
      })) !== null
    ) {
      const errorMessage = `Secret ${secretName} already exists in project ${projectId}`
      this.logger.error(errorMessage)
      throw new ConflictException(
        constructErrorBody('Secret already exists', errorMessage)
      )
    }
    this.logger.log(
      `Secret ${secretName} does not exist in project ${projectId}`
    )
  }
}
