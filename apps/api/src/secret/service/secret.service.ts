import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import {
  ApprovalAction,
  ApprovalItemType,
  ApprovalStatus,
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
import {
  SecretWithProject,
  SecretWithProjectAndVersion,
  SecretWithVersionAndEnvironment
} from '../secret.types'
import createEvent from '../../common/create-event'
import getDefaultEnvironmentOfProject from '../../common/get-default-project-environment'
import workspaceApprovalEnabled from '../../common/workspace-approval-enabled'
import createApproval from '../../common/create-approval'
import { UpdateSecretMetadata } from '../../approval/approval.types'
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

  async createSecret(
    user: User,
    dto: CreateSecret,
    projectId: Project['id'],
    reason?: string
  ) {
    const environmentId = dto.environmentId
    // Fetch the project
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: projectId },
        authority: Authority.CREATE_SECRET,
        prisma: this.prisma
      })

    // Check if the environment exists
    let environment: Environment | null = null
    if (environmentId) {
      environment =
        await this.authorityCheckerService.checkAuthorityOverEnvironment({
          userId: user.id,
          entity: { id: environmentId },
          authority: Authority.READ_ENVIRONMENT,
          prisma: this.prisma
        })
    }
    if (!environment) {
      environment = await getDefaultEnvironmentOfProject(projectId, this.prisma)
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

    const approvalEnabled = await workspaceApprovalEnabled(
      project.workspaceId,
      this.prisma
    )

    // Create the secret
    const secret = await this.prisma.secret.create({
      data: {
        name: dto.name,
        note: dto.note,
        rotateAt: addHoursToDate(dto.rotateAfter),
        pendingCreation:
          project.pendingCreation ||
          environment.pendingCreation ||
          approvalEnabled,
        versions: {
          create: {
            value: await encrypt(project.publicKey, dto.value),
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
          projectName: project.name,
          environmentId: environment.id,
          environmentName: environment.name
        },
        workspaceId: project.workspaceId
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} created secret ${secret.id}`)

    if (
      !project.pendingCreation &&
      !environment.pendingCreation &&
      approvalEnabled
    ) {
      const approval = await createApproval(
        {
          action: ApprovalAction.CREATE,
          itemType: ApprovalItemType.SECRET,
          itemId: secret.id,
          reason,
          user,
          workspaceId: project.workspaceId
        },
        this.prisma
      )
      return {
        secret,
        approval
      }
    } else {
      return secret
    }
  }

  async updateSecret(
    user: User,
    secretId: Secret['id'],
    dto: UpdateSecret,
    reason?: string
  ) {
    const secret = await this.authorityCheckerService.checkAuthorityOverSecret({
      userId: user.id,
      entity: { id: secretId },
      authority: Authority.UPDATE_SECRET,
      prisma: this.prisma
    })

    // Check if the secret already exists in the environment
    if (
      (dto.name && (await this.secretExists(dto.name, secret.environmentId))) ||
      secret.name === dto.name
    ) {
      throw new ConflictException(
        `Secret already exists: ${dto.name} in environment ${secret.environmentId}`
      )
    }

    // Encrypt the secret value before storing/processing it
    if (dto.value) {
      dto.value = await encrypt(secret.project.publicKey, dto.value)
    }

    if (
      !secret.pendingCreation &&
      (await workspaceApprovalEnabled(secret.project.workspaceId, this.prisma))
    ) {
      return await createApproval(
        {
          action: ApprovalAction.UPDATE,
          itemType: ApprovalItemType.SECRET,
          itemId: secret.id,
          reason,
          user,
          workspaceId: secret.project.workspaceId,
          metadata: dto
        },
        this.prisma
      )
    } else {
      return this.update(dto, user, secret)
    }
  }

  async updateSecretEnvironment(
    user: User,
    secretId: Secret['id'],
    environmentId: Environment['id'],
    reason?: string
  ) {
    const secret = await this.authorityCheckerService.checkAuthorityOverSecret({
      userId: user.id,
      entity: { id: secretId },
      authority: Authority.UPDATE_SECRET,
      prisma: this.prisma
    })

    if (secret.environmentId === environmentId) {
      throw new BadRequestException(
        `Can not update the environment of the secret to the same environment: ${environmentId} in project ${secret.projectId}`
      )
    }

    // Check if the environment exists
    const environment =
      await this.authorityCheckerService.checkAuthorityOverEnvironment({
        userId: user.id,
        entity: { id: environmentId },
        authority: Authority.READ_ENVIRONMENT,
        prisma: this.prisma
      })

    if (environment.projectId !== secret.projectId) {
      throw new BadRequestException(
        `Environment ${environmentId} does not belong to project ${secret.projectId}`
      )
    }

    // Check if the secret already exists in the environment
    if (await this.secretExists(secret.name, environmentId)) {
      throw new ConflictException(
        `Secret already exists: ${secret.name} in environment ${environmentId} in project ${secret.projectId}`
      )
    }

    if (
      !secret.pendingCreation &&
      (await workspaceApprovalEnabled(secret.project.workspaceId, this.prisma))
    ) {
      return await createApproval(
        {
          action: ApprovalAction.UPDATE,
          itemType: ApprovalItemType.SECRET,
          itemId: secret.id,
          reason,
          user,
          workspaceId: secret.project.workspaceId,
          metadata: {
            environmentId
          }
        },
        this.prisma
      )
    } else {
      return this.updateEnvironment(user, secret, environment)
    }
  }

  async rollbackSecret(
    user: User,
    secretId: Secret['id'],
    rollbackVersion: SecretVersion['version'],
    reason?: string
  ) {
    // Fetch the secret
    const secret = await this.authorityCheckerService.checkAuthorityOverSecret({
      userId: user.id,
      entity: { id: secretId },
      authority: Authority.UPDATE_SECRET,
      prisma: this.prisma
    })

    const maxVersion = secret.versions[secret.versions.length - 1].version

    // Check if the rollback version is valid
    if (rollbackVersion < 1 || rollbackVersion >= maxVersion) {
      throw new NotFoundException(
        `Invalid rollback version: ${rollbackVersion} for secret: ${secretId}`
      )
    }

    if (
      !secret.pendingCreation &&
      (await workspaceApprovalEnabled(secret.project.workspaceId, this.prisma))
    ) {
      return await createApproval(
        {
          action: ApprovalAction.UPDATE,
          itemType: ApprovalItemType.SECRET,
          itemId: secret.id,
          reason,
          user,
          workspaceId: secret.project.workspaceId,
          metadata: {
            rollbackVersion
          }
        },
        this.prisma
      )
    } else {
      return this.rollback(user, secret, rollbackVersion)
    }
  }

  async deleteSecret(user: User, secretId: Secret['id'], reason?: string) {
    // Check if the user has the required role
    const secret = await this.authorityCheckerService.checkAuthorityOverSecret({
      userId: user.id,
      entity: { id: secretId },
      authority: Authority.DELETE_SECRET,
      prisma: this.prisma
    })

    if (
      !secret.pendingCreation &&
      (await workspaceApprovalEnabled(secret.project.workspaceId, this.prisma))
    ) {
      return await createApproval(
        {
          action: ApprovalAction.DELETE,
          itemType: ApprovalItemType.SECRET,
          itemId: secretId,
          reason,
          user,
          workspaceId: secret.project.workspaceId
        },
        this.prisma
      )
    } else {
      return this.delete(user, secret)
    }
  }

  async getSecretById(
    user: User,
    secretId: Secret['id'],
    decryptValue: boolean
  ) {
    // Fetch the secret
    const secret = await this.authorityCheckerService.checkAuthorityOverSecret({
      userId: user.id,
      entity: { id: secretId },
      authority: Authority.READ_SECRET,
      prisma: this.prisma
    })

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
      for (let i = 0; i < secret.versions.length; i++) {
        const decryptedValue = await decrypt(
          project.privateKey,
          secret.versions[i].value
        )
        secret.versions[i].value = decryptedValue
      }
    }

    // Return the secret
    return secret
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
  ): Promise<
    {
      environment: { id: string; name: string }
      secrets: any[]
    }[]
  > {
    // Fetch the project
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: projectId },
        authority: Authority.READ_SECRET,
        prisma: this.prisma
      })

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

    const secrets = await this.prisma.secret.findMany({
      where: {
        projectId,
        pendingCreation: false,
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
      skip: page * limit,
      take: limit,
      orderBy: {
        [sort]: order
      }
    })

    // Group variables by environment
    const secretsByEnvironment: {
      [key: string]: {
        environment: { id: string; name: string }
        secrets: any[]
      }
    } = {}

    for (const secret of secrets) {
      // Optionally decrypt secret value if decryptValue is true
      if (decryptValue) {
        const latestSecretVersion = secret.versions[0]
        const decryptedValue = await decrypt(
          project.privateKey,
          latestSecretVersion.value
        )
        latestSecretVersion.value = decryptedValue
      }

      const { id, name } = secret.environment
      if (!secretsByEnvironment[id]) {
        secretsByEnvironment[id] = {
          environment: { id, name },
          secrets: []
        }
      }
      secretsByEnvironment[id].secrets.push(secret)
    }

    // Convert the object to an array and return
    return Object.values(secretsByEnvironment)
  }

  private async secretExists(
    secretName: Secret['name'],
    environmentId: Environment['id']
  ): Promise<boolean> {
    return (
      (await this.prisma.secret.count({
        where: {
          pendingCreation: false,
          name: secretName,
          environment: {
            id: environmentId
          }
        }
      })) > 0
    )
  }

  async makeSecretApproved(secretId: Secret['id']) {
    const secret = await this.prisma.secret.findUnique({
      where: {
        id: secretId
      }
    })

    const secretExists = await this.prisma.secret.count({
      where: {
        name: secret.name,
        environmentId: secret.environmentId,
        pendingCreation: false,
        projectId: secret.projectId
      }
    })

    if (secretExists > 0) {
      throw new ConflictException(
        `Secret already exists: ${secret.name} in environment ${secret.environmentId} in project ${secret.projectId}`
      )
    }

    return this.prisma.secret.update({
      where: {
        id: secretId
      },
      data: {
        pendingCreation: false
      }
    })
  }

  async update(
    dto: UpdateSecret | UpdateSecretMetadata,
    user: User,
    secret: SecretWithProjectAndVersion
  ) {
    let result

    // Update the secret
    // If a new secret value is proposed, we want to create a new version for
    // that secret
    if (dto.value) {
      const previousVersion = await this.prisma.secretVersion.findFirst({
        where: {
          secretId: secret.id
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
          id: secret.id
        },
        data: {
          name: dto.name,
          note: dto.note,
          rotateAt: addHoursToDate(dto.rotateAfter),
          lastUpdatedById: user.id,
          versions: {
            create: {
              value: dto.value, // The value is already encrypted
              version: previousVersion.version + 1,
              createdById: user.id
            }
          }
        }
      })

      try {
        await this.redis.publish(
          CHANGE_NOTIFIER_RSC,
          JSON.stringify({
            environmentId: secret.environmentId,
            name: secret.name,
            value: dto.value,
            isSecret: true
          })
        )
      } catch (error) {
        this.logger.error(
          this.logger.error(`Error publishing secret update to Redis: ${error}`)
        )
      }
    } else {
      result = await this.prisma.secret.update({
        where: {
          id: secret.id
        },
        data: {
          note: dto.note,
          name: dto.name,
          rotateAt: dto.rotateAfter
            ? addHoursToDate(dto.rotateAfter)
            : undefined,
          lastUpdatedById: user.id
        }
      })
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

  async updateEnvironment(
    user: User,
    secret: SecretWithProjectAndVersion,
    environment: Environment
  ) {
    // Update the secret
    const result = await this.prisma.secret.update({
      where: {
        id: secret.id
      },
      data: {
        environmentId: environment.id
      }
    })

    await createEvent(
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
        },
        workspaceId: secret.project.workspaceId
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} updated secret ${secret.id}`)

    return result
  }

  async rollback(
    user: User,
    secret: SecretWithProjectAndVersion,
    rollbackVersion: number
  ) {
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
          environmentId: secret.environmentId,
          name: secret.name,
          value: secret.versions[rollbackVersion - 1].value,
          isSecret: true
        })
      )
    } catch (error) {
      this.logger.error(
        this.logger.error(`Error publishing secret update to Redis: ${error}`)
      )
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

  async delete(user: User, secret: SecretWithProject) {
    const op = []

    // Delete the secret
    op.push(
      this.prisma.secret.delete({
        where: {
          id: secret.id
        }
      })
    )

    // If the secret is in pending creation and the workspace approval is enabled, we need to
    // delete the approval as well
    if (
      secret.pendingCreation &&
      (await workspaceApprovalEnabled(secret.project.workspaceId, this.prisma))
    ) {
      op.push(
        this.prisma.approval.deleteMany({
          where: {
            itemId: secret.id,
            itemType: ApprovalItemType.SECRET,
            action: ApprovalAction.CREATE,
            status: ApprovalStatus.PENDING
          }
        })
      )
    }

    await this.prisma.$transaction(op)

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
}
