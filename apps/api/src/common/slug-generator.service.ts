import { PrismaService } from '@/prisma/prisma.service'
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import slugify from 'slugify'
import { constructErrorBody } from './util'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { RedisClientType } from 'redis'

@Injectable()
export default class SlugGenerator {
  private readonly logger: Logger = new Logger(SlugGenerator.name)
  private static readonly MAX_ITERATIONS: number = 10

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private redisClient: { publisher: RedisClientType }
  ) {}

  /**
   * Constructs a cache key for storing or retrieving a slug.
   *
   * @param baseSlug The base slug string.
   * @param model The model name as a key of PrismaClient.
   * @returns The constructed cache key as a string.
   */
  private getSlugKey(baseSlug: string, model: keyof PrismaClient): string {
    return `slug-${model.toString()}-${baseSlug}`
  }

  /**
   * Retrieves the latest created slug for a given base slug and model from the cache.
   *
   * @param baseSlug The base slug string.
   * @param model The model name as a key of PrismaClient.
   * @returns The latest created slug as a string or null if not found.
   */
  private async fetchLatestCreatedSlug(
    baseSlug: string,
    model: keyof PrismaClient
  ): Promise<number | null> {
    this.logger.log(
      `Fetching latest created slug for base slug ${baseSlug} and model ${model.toString()} from cache...`
    )
    const cachedSlugNumericPart = await this.redisClient.publisher.get(
      this.getSlugKey(baseSlug, model)
    )

    if (cachedSlugNumericPart) {
      this.logger.log(
        `Found cached slug's numeric part: ${cachedSlugNumericPart}`
      )
      return parseInt(cachedSlugNumericPart, 10)
    } else {
      this.logger.log(
        `No cached slug found for base slug ${baseSlug} and model ${model.toString()}.`
      )
      return null
    }
  }

  /**
   * Caches a slug in Redis for a given base slug and model.
   *
   * @param baseSlug The base slug string.
   * @param model The model name as a key of PrismaClient.
   * @param numericPart The numeric part of the slug to cache.
   *
   * @remarks
   * The slug is cached for a day.
   */
  private async cacheSlug(
    baseSlug: string,
    model: keyof PrismaClient,
    numericPart: number
  ): Promise<void> {
    this.logger.log(
      `Caching numeric part ${numericPart} for base slug ${baseSlug} and model ${model.toString()}....`
    )
    await this.redisClient.publisher.set(
      this.getSlugKey(baseSlug, model),
      numericPart.toString(),
      {
        EX: 60 * 60 * 24 // Cache for 1 day
      }
    )
    this.logger.log(
      `Cached numeric part ${numericPart} for base slug ${baseSlug} and model ${model.toString()}`
    )
  }

  /**
   * Generates a unique slug for a given name and model.
   *
   * @param name The name to generate a slug from.
   * @param model The model name as a key of PrismaClient.
   * @param iterationCount The number of iterations attempted to generate a unique slug.
   * @returns A unique slug for the given name in the given model.
   *
   * @remarks
   * This function will throw an InternalServerErrorException if the iteration count exceeds the limit (10).
   * The function will check the cache first to see if the slug already exists. If it does, it will use the cached slug.
   * If the slug does not exist in the cache, it will get all slugs that match the base slug with a numeric part
   * and find the maximum value. It will then generate a new slug by incrementing the maximum value by 1.
   * If the new slug already exists, the function will call itself recursively to generate a new slug.
   * The function will store the new slug in the cache.
   */
  private async generateUniqueSlug(
    name: string,
    model: keyof PrismaClient,
    iterationCount: number = 0
  ): Promise<string> {
    // Check if the iteration count exceeds the limit
    if (iterationCount > SlugGenerator.MAX_ITERATIONS) {
      throw new InternalServerErrorException(
        constructErrorBody(
          'Too many iterations while generating slug',
          `Failed to generate unique slug for ${name} in ${model.toString()} after ${SlugGenerator.MAX_ITERATIONS} attempts.`
        )
      )
    }

    this.logger.log(
      `Generating unique slug for ${name} in ${model.toString()}...`
    )

    const baseSlug = slugify(name, { lower: true, strict: true })
    this.logger.log(`Generated base slug for ${name}: ${baseSlug}`)

    let max: number = 0
    let newSlug: string | undefined

    // Check if the slug already exists in the cache
    const cachedSlugNumericPart = await this.fetchLatestCreatedSlug(
      baseSlug,
      model
    )
    if (cachedSlugNumericPart) {
      this.logger.log(
        `Found cached slug's numeric part: ${cachedSlugNumericPart}`
      )
      max = cachedSlugNumericPart
    } else {
      // Get all slugs that match baseSlug-N
      const existingSlugs = await (this.prisma[model] as any).findMany({
        where: {
          slug: {
            startsWith: baseSlug
          }
        },
        select: {
          slug: true
        }
      })
      this.logger.log(`Existing slugs for ${name}: ${existingSlugs.length}`)

      if (existingSlugs.length === 0) {
        newSlug = `${baseSlug}-0`
      } else {
        for (const existingSlug of existingSlugs) {
          const numericPart = existingSlug.slug.split('-').pop()
          if (numericPart && !isNaN(parseInt(numericPart, 10))) {
            max = Math.max(max, parseInt(numericPart, 10))
          }
        }
      }
    }

    // Add randomization to reduce collision probability
    if (!newSlug) {
      max += 1
      // Add a short random string to the slug for extra uniqueness
      const randomSuffix = Math.random().toString(36).substring(2, 6)
      newSlug = `${baseSlug}-${max}-${randomSuffix}`
      this.logger.log(`Generated new slug for ${name}: ${newSlug}`)

      // Check if the new slug already exists
      this.logger.log(
        `Checking if slug already exists in ${model.toString()}...`
      )
      const slugExists = await (this.prisma[model] as any).findFirst({
        where: {
          slug: newSlug
        }
      })

      if (slugExists) {
        this.logger.log(
          `Slug ${newSlug} already exists in ${model.toString()}. Retrying with incremented iteration.`
        )
        return await this.generateUniqueSlug(name, model, iterationCount + 1)
      }
    }

    this.logger.log(
      `Slug ${newSlug} is unique in ${model.toString()}. Iteration count: ${iterationCount}`
    )

    // Store the new slug in the cache
    await this.cacheSlug(baseSlug, model, max)

    return newSlug!
  }

  /**
   * Generates a unique slug for the given entity type.
   * @param name The name of the entity to generate a slug for
   * @param entityType The type of the entity to generate a slug for
   * @returns The generated slug
   */
  async generateEntitySlug(
    name: string | null | undefined,
    entityType:
      | 'WORKSPACE_ROLE'
      | 'WORKSPACE'
      | 'PROJECT'
      | 'VARIABLE'
      | 'SECRET'
      | 'INTEGRATION'
      | 'ENVIRONMENT'
      | 'API_KEY'
  ): Promise<string> {
    if (!name) return undefined

    switch (entityType) {
      case 'WORKSPACE_ROLE':
        return this.generateUniqueSlug(name, 'workspaceRole')
      case 'WORKSPACE':
        return this.generateUniqueSlug(name, 'workspace')
      case 'PROJECT':
        return this.generateUniqueSlug(name, 'project')
      case 'VARIABLE':
        return this.generateUniqueSlug(name, 'variable')
      case 'SECRET':
        return this.generateUniqueSlug(name, 'secret')
      case 'INTEGRATION':
        return this.generateUniqueSlug(name, 'integration')
      case 'ENVIRONMENT':
        return this.generateUniqueSlug(name, 'environment')
      case 'API_KEY':
        return this.generateUniqueSlug(name, 'apiKey')
    }
  }
}
