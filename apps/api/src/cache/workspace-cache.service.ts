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
import { Authority, Subscription, User, Workspace } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { HydratedWorkspace, RawWorkspace } from '@/workspace/workspace.types'
import { InclusionQuery } from '@/common/inclusion-query'
import { constructErrorBody } from '@/common/util'

@Injectable()
export class WorkspaceCacheService implements OnModuleDestroy {
  private static readonly SUBSCRIPTION_PREFIX = 'workspace-subscription-'
  private static readonly WORKSPACE_COLLECTIVE_AUTHORITIES_PREFIX =
    'user-workspace-collective-authorities-'
  private static readonly RAW_WORKSPACE_PREFIX = 'raw-workspace-'
  private static readonly HYDRATED_WORKSPACE_PREFIX = 'hydrated-workspace-'
  private static readonly WORKSPACE_ADMIN_PREFIX = 'workspace-admin-'
  private static readonly WORKSPACE_KEYS_PREFIX = 'workspace-keys-' // Stores all the keys associated with this workspace

  private readonly logger = new Logger(WorkspaceCacheService.name)

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: { publisher: RedisClientType },
    private readonly prisma: PrismaService
  ) {}

  async onModuleDestroy() {
    await this.redisClient.publisher.quit()
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

  async removeHydratedWorkspaceCache(workspace: Workspace) {
    const workspaceId = workspace.id
    this.logger.log(
      `Removing hydrated workspace cache for workspace ${workspaceId}`
    )
    const key = this.getWorkspaceKeysKey(workspaceId)
    const allKeys = await this.redisClient.publisher.sMembers(key)
    if (allKeys === null) {
      this.logger.log(
        `No workspace keys found in cache for workspace ${workspaceId}`
      )
      return
    } else {
      const filteredKeys = allKeys.filter((k) =>
        k.startsWith(
          `${WorkspaceCacheService.HYDRATED_WORKSPACE_PREFIX}-${workspaceId}`
        )
      )
      await this.redisClient.publisher.del(filteredKeys)
      this.logger.log(
        `${filteredKeys.length} hydrated workspace keys removed from cache for workspace ${workspaceId}`
      )
    }
  }

  async removeWorkspaceCache(workspace: Workspace) {
    const workspaceSlug = workspace.slug

    this.logger.log(`Removing workspace cache for workspace ${workspaceSlug}`)

    const key = this.getWorkspaceKeysKey(workspaceSlug)
    const workspaceKeysRaw = await this.redisClient.publisher.get(key)

    if (workspaceKeysRaw === null) {
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
    if (subscriptionJson === null) {
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

  async getHydratedWorkspace(
    workspaceSlug: Workspace['slug'],
    userId: User['id']
  ): Promise<HydratedWorkspace | null> {
    this.logger.log(`Attempting to fetch workspace ${workspaceSlug} from cache`)

    const key = this.getHydratedWorkspaceKey(workspaceSlug, userId)
    const hydratedWorkspaceJson = await this.redisClient.publisher.get(key)

    if (hydratedWorkspaceJson === null) {
      this.logger.log(
        `Hydrated workspace not found in cache for ${workspaceSlug}. Fetching from database...`
      )
      return null
    } else {
      this.logger.log(`Hydrated workspace found in cache for ${workspaceSlug}`)
      return JSON.parse(hydratedWorkspaceJson) as HydratedWorkspace
    }
  }

  async setHydratedWorkspace(
    hydratedWorkspace: HydratedWorkspace,
    userId: User['id']
  ): Promise<void> {
    const workspaceSlug = hydratedWorkspace.id
    this.logger.log(`Caching hydrated workspace ${workspaceSlug}`)

    const key = this.getHydratedWorkspaceKey(workspaceSlug, userId)
    const hydratedWorkspaceJson = JSON.stringify(hydratedWorkspace)
    await this.redisClient.publisher.set(key, hydratedWorkspaceJson)
    await this.addWorkspaceKey(hydratedWorkspace.id, key)

    this.logger.log(`Hydrated workspace ${workspaceSlug} cached`)
  }

  async getRawWorkspace(
    workspaceSlug: Workspace['slug']
  ): Promise<RawWorkspace | null> {
    this.logger.log(`Attempting to fetch workspace ${workspaceSlug} from cache`)

    const key = this.getRawWorkspaceKey(workspaceSlug)
    const rawWorkspaceJson = await this.redisClient.publisher.get(key)
    let rawWorkspace: RawWorkspace | null

    if (rawWorkspaceJson === null) {
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

  async setCollectiveWorkspaceAuthorities(
    userId: User['id'],
    workspaceId: Workspace['id'],
    authorities: Set<Authority>
  ) {
    this.logger.log(
      `Updating user ${userId} workspace ${workspaceId} authorities cache`
    )
    const key = this.getCollectiveWorkspaceAuthoritiesKey(workspaceId, userId)
    await this.redisClient.publisher.sAdd(key, Array.from(authorities))
    await this.addWorkspaceKey(workspaceId, key)
    this.logger.log(
      `User ${userId} workspace ${workspaceId} authorities cache updated`
    )
  }

  async getCollectiveWorkspaceAuthorities(
    workspaceId: Workspace['id'],
    userId: User['id']
  ): Promise<Set<Authority>> {
    this.logger.log(
      `Attempting to fetch workspace ${workspaceId} authorities from cache`
    )
    const key = this.getCollectiveWorkspaceAuthoritiesKey(workspaceId, userId)
    const rawAuthorities = await this.redisClient.publisher.sMembers(key)

    return new Set(rawAuthorities as Authority[])
  }

  private getWorkspaceSubscriptionKey(workspaceId: Workspace['id']): string {
    return `${WorkspaceCacheService.SUBSCRIPTION_PREFIX}${workspaceId}`
  }

  private getRawWorkspaceKey(workspaceSlug: Workspace['slug']): string {
    return `${WorkspaceCacheService.RAW_WORKSPACE_PREFIX}${workspaceSlug}`
  }

  private getHydratedWorkspaceKey(
    workspaceSlug: Workspace['slug'],
    userId: User['id']
  ): string {
    return `${WorkspaceCacheService.HYDRATED_WORKSPACE_PREFIX}${workspaceSlug}-${userId}`
  }

  private getCollectiveWorkspaceAuthoritiesKey(
    workspaceSlug: Workspace['slug'],
    userId: User['id']
  ): string {
    return `${WorkspaceCacheService.WORKSPACE_COLLECTIVE_AUTHORITIES_PREFIX}${userId}-${workspaceSlug}`
  }

  private getWorkspaceAdminKey(workspaceSlug: Workspace['slug']): string {
    return `${WorkspaceCacheService.WORKSPACE_ADMIN_PREFIX}${workspaceSlug}`
  }

  private getWorkspaceKeysKey(workspaceId: Workspace['id']): string {
    return `${WorkspaceCacheService.WORKSPACE_KEYS_PREFIX}${workspaceId}`
  }
}
