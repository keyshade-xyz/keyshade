import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleDestroy
} from '@nestjs/common'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { RedisClientType } from 'redis'
import { Subscription, User, Workspace } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { RawWorkspace } from '@/workspace/workspace.types'
import { InclusionQuery } from '@/common/inclusion-query'
import { constructErrorBody } from '@/common/util'
import { RawProject } from '@/project/project.types'
import { RawIntegration } from '@/integration/integration.types'
import { RawWorkspaceRole } from '@/workspace-role/workspace-role.types'

@Injectable()
export class WorkspaceCacheService implements OnModuleDestroy {
  private static readonly SUBSCRIPTION_PREFIX = 'workspace-subscription-'
  private static readonly RAW_WORKSPACE_PREFIX = 'raw-workspace-'
  private static readonly WORKSPACE_ADMIN_PREFIX = 'workspace-admin-'
  private static readonly WORKSPACE_KEYS_PREFIX = 'workspace-keys-' // Stores all the keys associated with this workspace

  private readonly logger = new Logger(WorkspaceCacheService.name)

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: { publisher: RedisClientType },
    private readonly prisma: PrismaService
  ) {}

  async onModuleDestroy() {
    const pub = this.redisClient.publisher

    if (!pub) return

    // node-redis v4 exposes `isOpen`; only quit when connected
    if (typeof pub.isOpen === 'boolean' && !pub.isOpen) return

    try {
      await pub.quit()
    } catch (err: any) {
      // Ignore "The client is closed" during shutdown
      if (!err || !/The client is closed/i.test(String(err.message))) {
        throw err
      }
    }
  }

  async addWorkspaceKey(workspaceId: Workspace['id'], newKey: string) {
    this.logger.log(
      `Adding workspace key ${newKey} to cache for workspace ${workspaceId}`
    )
    const key = this.getWorkspaceKeysKey(workspaceId)
    await this.redisClient.publisher.sAdd(key, newKey)
    this.logger.log(
      `Workspace key ${newKey} added to cache for workspace ${workspaceId}`
    )
  }

  async removeWorkspaceCache(workspace: Workspace) {
    const workspaceSlug = workspace.slug

    this.logger.log(`Removing workspace cache for workspace ${workspaceSlug}`)

    const key = this.getWorkspaceKeysKey(workspaceSlug)
    const workspaceKeysRaw = await this.redisClient.publisher.get(key)

    if (!workspaceKeysRaw) {
      this.logger.log(
        `No workspace keys found in cache for workspace ${workspaceSlug}`
      )
      return
    } else {
      await this.redisClient.publisher.del(
        JSON.parse(workspaceKeysRaw) as string[]
      )
      this.logger.log(
        `Workspace keys removed from cache for workspace ${workspaceSlug}`
      )
    }
  }

  async getWorkspaceSubscription(
    workspaceId: Workspace['id']
  ): Promise<Subscription> {
    this.logger.log(
      `Attempting to fetch subscription for ${workspaceId} from cache`
    )

    const key = this.getWorkspaceSubscriptionKey(workspaceId)
    const subscriptionJson = await this.redisClient.publisher.get(key)

    let subscription: Subscription | null
    if (!subscriptionJson) {
      this.logger.log(
        `Subscription not found in cache for ${workspaceId}. Fetching from database...`
      )

      subscription = await this.prisma.subscription.findFirst({
        where: {
          workspaceId
        }
      })
      this.logger.log(
        `Found subscription ${subscription.id} for workspace ${workspaceId}`
      )

      await this.setWorkspaceSubscription(subscription)
    } else {
      subscription = JSON.parse(subscriptionJson) as Subscription
    }

    return subscription
  }

  async setWorkspaceSubscription(subscription: Subscription) {
    const workspaceId = subscription.workspaceId
    this.logger.log(
      `Setting subscription cache for workspace ${workspaceId} to subscription ${subscription.id}`
    )

    const key = this.getWorkspaceSubscriptionKey(workspaceId)
    const subscriptionJson = JSON.stringify(subscription)
    await this.redisClient.publisher.set(key, subscriptionJson)
    await this.addWorkspaceKey(workspaceId, key)

    this.logger.log(`Subscription cache set for workspace ${workspaceId}`)
  }

  async getRawWorkspace(
    workspaceSlug: Workspace['slug']
  ): Promise<RawWorkspace | null> {
    this.logger.log(`Attempting to fetch workspace ${workspaceSlug} from cache`)

    const key = this.getRawWorkspaceKey(workspaceSlug)
    const rawWorkspaceJson = await this.redisClient.publisher.get(key)
    let rawWorkspace: RawWorkspace | null

    if (!rawWorkspaceJson) {
      this.logger.log(
        `Raw workspace not found in cache for ${workspaceSlug}. Fetching from database...`
      )

      try {
        rawWorkspace = await this.prisma.workspace.findUnique({
          where: {
            slug: workspaceSlug
          },
          include: InclusionQuery.Workspace
        })
      } catch (error) {
        this.logger.error(error)
        throw new InternalServerErrorException(error)
      }

      if (!rawWorkspace) {
        this.logger.warn(`Workspace ${workspaceSlug} not found`)
        throw new NotFoundException(
          constructErrorBody(
            'Workspace not found',
            `Workspace ${workspaceSlug} not found`
          )
        )
      }

      await this.setRawWorkspace(rawWorkspace)
    } else {
      this.logger.log(`Raw workspace found in cache for ${workspaceSlug}`)
      rawWorkspace = JSON.parse(rawWorkspaceJson) as RawWorkspace
    }

    return rawWorkspace
  }

  async setRawWorkspace(rawWorkspace: Workspace) {
    const workspaceSlug = rawWorkspace.slug
    this.logger.log(`Caching raw workspace ${workspaceSlug}`)

    const key = this.getRawWorkspaceKey(workspaceSlug)
    const rawWorkspaceJson = JSON.stringify(rawWorkspace)
    await this.redisClient.publisher.set(key, rawWorkspaceJson)
    await this.addWorkspaceKey(rawWorkspace.id, key)

    this.logger.log(`Raw workspace ${workspaceSlug} cached`)
  }

  async getWorkspaceAdmin(
    workspaceSlug: Workspace['slug']
  ): Promise<User['id'] | null> {
    this.logger.log(
      `Attempting to fetch workspace ${workspaceSlug} admin from cache`
    )

    const key = this.getWorkspaceAdminKey(workspaceSlug)
    const userId = this.redisClient.publisher.get(key)

    if (userId === null) {
      this.logger.log('Workspace admin not found in cache')
    } else {
      this.logger.log(
        `Workspace admin found in cache for workspace ${workspaceSlug}`
      )
    }

    return userId
  }

  async setWorkspaceAdmin(workspaceId: Workspace['id'], userId: User['id']) {
    this.logger.log(
      `Setting workspace ${workspaceId} admin to ${userId} in cache`
    )

    const key = this.getWorkspaceAdminKey(workspaceId)
    await this.redisClient.publisher.set(key, userId)
    await this.addWorkspaceKey(workspaceId, key)

    this.logger.log(`Workspace ${workspaceId} admin set to ${userId} in cache`)
  }

  async addProjectToRawWorkspace(workspace: Workspace, project: RawProject) {
    const workspaceSlug = workspace.slug
    const projectId = project.id

    this.logger.log(
      `Adding project ${projectId} to workspace ${workspaceSlug} in cache`
    )

    const rawWorkspace = await this.getRawWorkspace(workspaceSlug)
    if (rawWorkspace !== null) {
      rawWorkspace.projects.push({
        id: projectId,
        slug: project.slug
      })
      await this.setRawWorkspace(rawWorkspace)
    }
  }

  async removeProjectFromRawWorkspace(
    workspace: Workspace,
    projectId: RawProject['id']
  ) {
    const workspaceSlug = workspace.slug
    this.logger.log(
      `Removing project ${projectId} from workspace ${workspaceSlug} in cache`
    )

    const rawWorkspace = await this.getRawWorkspace(workspaceSlug)
    if (rawWorkspace !== null) {
      rawWorkspace.projects = rawWorkspace.projects.filter(
        (p) => p.id !== projectId
      )
      await this.setRawWorkspace(rawWorkspace)
    }
  }

  async addMemberToRawWorkspace(workspace: Workspace, memberId: User['id']) {
    const workspaceSlug = workspace.slug
    this.logger.log(
      `Adding member ${memberId} to workspace ${workspaceSlug} in cache`
    )

    const rawWorkspace = await this.getRawWorkspace(workspaceSlug)
    if (rawWorkspace !== null) {
      rawWorkspace.members.push({
        id: memberId
      })
      await this.setRawWorkspace(rawWorkspace)
    }
  }

  async removeMemberFromRawWorkspace(
    workspace: Workspace,
    memberId: User['id']
  ) {
    const workspaceSlug = workspace.slug
    this.logger.log(
      `Removing member ${memberId} from workspace ${workspaceSlug} in cache`
    )

    const rawWorkspace = await this.getRawWorkspace(workspaceSlug)
    if (rawWorkspace !== null) {
      rawWorkspace.members = rawWorkspace.members.filter(
        (m) => m.id !== memberId
      )
      await this.setRawWorkspace(rawWorkspace)
    }
  }

  async addRoleToRawWorkspace(workspace: Workspace, role: RawWorkspaceRole) {
    const workspaceSlug = workspace.slug
    this.logger.log(
      `Adding role ${role.id} to workspace ${workspaceSlug} in cache`
    )

    const rawWorkspace = await this.getRawWorkspace(workspaceSlug)
    if (rawWorkspace !== null) {
      rawWorkspace.roles.push({
        id: role.id,
        slug: role.slug
      })
      await this.setRawWorkspace(rawWorkspace)
    }
  }

  async removeRoleFromRawWorkspace(
    workspace: Workspace,
    roleId: RawWorkspaceRole['id']
  ) {
    const workspaceSlug = workspace.slug
    this.logger.log(
      `Removing role ${roleId} from workspace ${workspaceSlug} in cache`
    )

    const rawWorkspace = await this.getRawWorkspace(workspaceSlug)
    if (rawWorkspace !== null) {
      rawWorkspace.roles = rawWorkspace.roles.filter((r) => r.id !== roleId)
      await this.setRawWorkspace(rawWorkspace)
    }
  }

  async addIntegrationToRawWorkspace(
    workspace: Workspace,
    integration: RawIntegration
  ) {
    const workspaceSlug = workspace.slug
    this.logger.log(
      `Adding integration ${integration.id} to workspace ${workspaceSlug} in cache`
    )

    const rawWorkspace = await this.getRawWorkspace(workspaceSlug)
    if (rawWorkspace !== null) {
      rawWorkspace.integrations.push({
        id: integration.id,
        slug: integration.slug
      })
      await this.setRawWorkspace(rawWorkspace)
    }
  }

  async removeIntegrationFromRawWorkspace(
    workspace: Workspace,
    integrationId: RawIntegration['id']
  ) {
    const workspaceSlug = workspace.slug
    this.logger.log(
      `Removing integration ${integrationId} from workspace ${workspaceSlug} in cache`
    )

    const rawWorkspace = await this.getRawWorkspace(workspaceSlug)
    if (rawWorkspace !== null) {
      rawWorkspace.integrations = rawWorkspace.integrations.filter(
        (i) => i.id !== integrationId
      )
      await this.setRawWorkspace(rawWorkspace)
    }
  }

  async updateRawWorkspaceSubscription(
    workspace: Workspace,
    subscription: Subscription
  ) {
    const workspaceSlug = workspace.slug
    this.logger.log(`Updating workspace ${workspaceSlug} subscription in cache`)

    const rawWorkspace = await this.getRawWorkspace(workspaceSlug)
    if (rawWorkspace !== null) {
      rawWorkspace.subscription = subscription
      await this.setRawWorkspace(rawWorkspace)
    }
  }

  private getWorkspaceSubscriptionKey(workspaceId: Workspace['id']): string {
    return `${WorkspaceCacheService.SUBSCRIPTION_PREFIX}${workspaceId}`
  }

  private getRawWorkspaceKey(workspaceSlug: Workspace['slug']): string {
    return `${WorkspaceCacheService.RAW_WORKSPACE_PREFIX}${workspaceSlug}`
  }

  private getWorkspaceAdminKey(workspaceSlug: Workspace['slug']): string {
    return `${WorkspaceCacheService.WORKSPACE_ADMIN_PREFIX}${workspaceSlug}`
  }

  private getWorkspaceKeysKey(workspaceId: Workspace['id']): string {
    return `${WorkspaceCacheService.WORKSPACE_KEYS_PREFIX}${workspaceId}`
  }
}
