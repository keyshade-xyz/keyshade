import { Inject, Injectable, Logger } from '@nestjs/common'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { RedisClientType } from 'redis'
import { Authority, Project, User, Workspace } from '@prisma/client'

@Injectable()
export class CollectiveAuthoritiesCacheService {
  private static readonly WORKSPACE_COLLECTIVE_AUTHORITIES_PREFIX =
    'user-workspace-collective-authorities-'
  private static readonly PROJECT_COLLECTIVE_AUTHORITIES_PREFIX =
    'user-project-collective-authorities-'
  private static readonly WORKSPACE_COLLECTIVE_AUTHORITY_KEYS_PREFIX =
    'workspace-collective-authority-keys-'

  private readonly logger = new Logger(CollectiveAuthoritiesCacheService.name)

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: { publisher: RedisClientType }
  ) {}

  async addWorkspaceCollectiveAuthorityKey(
    workspaceId: Workspace['id'],
    newKey: string
  ): Promise<void> {
    const key = this.getWorkspaceCollectiveAuthorityKeysKey(workspaceId)
    await this.redisClient.publisher.sAdd(key, newKey)
  }

  async removeWorkspaceCollectiveAuthorityCache(
    workspaceId: Workspace['id']
  ): Promise<void> {
    this.logger.log(
      `Removing workspace collective authority cache for workspace ${workspaceId}`
    )

    const key = this.getWorkspaceCollectiveAuthorityKeysKey(workspaceId)
    try {
      const workspaceCollectiveAuthorityKeys =
        await this.redisClient.publisher.sMembers(key)
      if (workspaceCollectiveAuthorityKeys.length === 0) {
        this.logger.log(
          `No workspace collective authority keys found for workspace ${workspaceId}`
        )
        return
      }
      await this.redisClient.publisher.del(workspaceCollectiveAuthorityKeys)
      this.logger.log(
        `Workspace collective authority cache removed for workspace ${workspaceId}`
      )
    } catch (err) {
      this.logger.error(err)
      throw err
    }
  }

  async setCollectiveWorkspaceAuthorities(
    workspaceId: Workspace['id'],
    userId: User['id'],
    authorities: Set<Authority>
  ) {
    this.logger.log(
      `Updating user ${userId} workspace ${workspaceId} authorities cache`
    )
    const key = this.getCollectiveWorkspaceAuthoritiesKey(workspaceId, userId)
    const values = Array.from(authorities ?? []).map((a) => String(a))
    if (values.length > 0) {
      await this.redisClient.publisher.sAdd(key, values)
    } else {
      this.logger.log(
        `No authorities provided for user ${userId} in workspace ${workspaceId}`
      )
    }

    await this.addWorkspaceCollectiveAuthorityKey(workspaceId, key)
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

  async setCollectiveProjectAuthorities(
    projectId: Project['id'],
    userId: User['id'],
    workspaceId: Workspace['id'],
    authorities: Set<Authority>
  ): Promise<void> {
    this.logger.log(`Updating user ${userId} project ${projectId} cache`)

    const key = this.getCollectiveProjectAuthoritiesKey(projectId, userId)
    const values = Array.from(authorities ?? []).map((a) => String(a))
    if (values.length > 0) {
      await this.redisClient.publisher.sAdd(key, values)
    } else {
      this.logger.log(
        `No authorities provided for user ${userId} in project ${projectId}`
      )
    }

    await this.addWorkspaceCollectiveAuthorityKey(workspaceId, key)
    this.logger.log(
      `User ${userId} project ${projectId} authorities cache updated`
    )
  }

  async getCollectiveProjectAuthorities(
    projectId: Project['id'],
    userId: User['id']
  ): Promise<Set<Authority>> {
    this.logger.log(`Attempting to fetch project ${projectId} cache`)
    const key = this.getCollectiveProjectAuthoritiesKey(projectId, userId)
    const rawAuthorities = await this.redisClient.publisher.sMembers(key)

    return new Set(rawAuthorities as Authority[])
  }

  private getCollectiveWorkspaceAuthoritiesKey(
    workspaceId: Workspace['id'],
    userId: User['id']
  ): string {
    return `${CollectiveAuthoritiesCacheService.WORKSPACE_COLLECTIVE_AUTHORITIES_PREFIX}${userId}-${workspaceId}`
  }

  private getCollectiveProjectAuthoritiesKey(
    projectId: Project['id'],
    userId: User['id']
  ): string {
    return `${CollectiveAuthoritiesCacheService.PROJECT_COLLECTIVE_AUTHORITIES_PREFIX}${userId}-${projectId}`
  }

  private getWorkspaceCollectiveAuthorityKeysKey(
    workspaceId: Workspace['id']
  ): string {
    return `${CollectiveAuthoritiesCacheService.WORKSPACE_COLLECTIVE_AUTHORITY_KEYS_PREFIX}${workspaceId}`
  }
}
