import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateApiKey } from '../dto/create.api-key/create.api-key'
import { UpdateApiKey } from '../dto/update.api-key/update.api-key'
import { ApiKey, User } from '@prisma/client'
import generateEntitySlug from '@/common/slug-generator'
import { generateApiKey, toSHA256 } from '@/common/cryptography'
import { addHoursToDate, limitMaxItemsPerPage } from '@/common/util'

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name)

  constructor(private readonly prisma: PrismaService) {}

  private apiKeySelect = {
    id: true,
    expiresAt: true,
    name: true,
    slug: true,
    authorities: true,
    createdAt: true,
    updatedAt: true
  }

  /**
   * Creates a new API key for the given user.
   *
   * @throws `ConflictException` if the API key already exists.
   * @param user The user to create the API key for.
   * @param dto The data to create the API key with.
   * @returns The created API key.
   */
  async createApiKey(user: User, dto: CreateApiKey) {
    await this.isApiKeyUnique(user, dto.name)

    const plainTextApiKey = generateApiKey()
    const hashedApiKey = toSHA256(plainTextApiKey)
    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: dto.name,
        slug: await generateEntitySlug(dto.name, 'API_KEY', this.prisma),
        value: hashedApiKey,
        authorities: dto.authorities
          ? {
              set: dto.authorities
            }
          : [],
        expiresAt: addHoursToDate(dto.expiresAfter),
        user: {
          connect: {
            id: user.id
          }
        }
      }
    })

    this.logger.log(`User ${user.id} created API key ${apiKey.id}`)

    return {
      ...apiKey,
      value: plainTextApiKey
    }
  }

  /**
   * Updates an existing API key of the given user.
   *
   * @throws `ConflictException` if the API key name already exists.
   * @throws `NotFoundException` if the API key with the given slug does not exist.
   * @param user The user to update the API key for.
   * @param apiKeySlug The slug of the API key to update.
   * @param dto The data to update the API key with.
   * @returns The updated API key.
   */
  async updateApiKey(
    user: User,
    apiKeySlug: ApiKey['slug'],
    dto: UpdateApiKey
  ) {
    await this.isApiKeyUnique(user, dto.name)

    const apiKey = await this.prisma.apiKey.findUnique({
      where: {
        slug: apiKeySlug
      }
    })
    const apiKeyId = apiKey.id

    if (!apiKey) {
      throw new NotFoundException(`API key ${apiKeySlug} not found`)
    }

    const updatedApiKey = await this.prisma.apiKey.update({
      where: {
        id: apiKeyId,
        userId: user.id
      },
      data: {
        name: dto.name,
        slug: dto.name
          ? await generateEntitySlug(dto.name, 'API_KEY', this.prisma)
          : apiKey.slug,
        authorities: {
          set: dto.authorities ? dto.authorities : apiKey.authorities
        },
        expiresAt: dto.expiresAfter
          ? addHoursToDate(dto.expiresAfter)
          : undefined
      },
      select: this.apiKeySelect
    })

    this.logger.log(`User ${user.id} updated API key ${apiKeyId}`)

    return updatedApiKey
  }

  /**
   * Deletes an API key of the given user.
   *
   * @throws `NotFoundException` if the API key with the given slug does not exist.
   * @param user The user to delete the API key for.
   * @param apiKeySlug The slug of the API key to delete.
   */
  async deleteApiKey(user: User, apiKeySlug: ApiKey['slug']) {
    try {
      await this.prisma.apiKey.delete({
        where: {
          slug: apiKeySlug,
          userId: user.id
        }
      })
    } catch (error) {
      throw new NotFoundException(`API key ${apiKeySlug} not found`)
    }

    this.logger.log(`User ${user.id} deleted API key ${apiKeySlug}`)
  }

  /**
   * Retrieves an API key of the given user by slug.
   *
   * @throws `NotFoundException` if the API key with the given slug does not exist.
   * @param user The user to retrieve the API key for.
   * @param apiKeySlug The slug of the API key to retrieve.
   * @returns The API key with the given slug.
   */
  async getApiKeyBySlug(user: User, apiKeySlug: ApiKey['slug']) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: {
        slug: apiKeySlug,
        userId: user.id
      },
      select: this.apiKeySelect
    })

    if (!apiKey) {
      throw new NotFoundException(`API key ${apiKeySlug} not found`)
    }

    return apiKey
  }

  /**
   * Retrieves all API keys of the given user.
   *
   * @param user The user to retrieve the API keys for.
   * @param page The page number to retrieve.
   * @param limit The maximum number of items to retrieve per page.
   * @param sort The column to sort by.
   * @param order The order to sort by.
   * @param search The search string to filter the API keys by.
   * @returns The API keys of the given user, filtered by the search string.
   */
  async getAllApiKeysOfUser(
    user: User,
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    return await this.prisma.apiKey.findMany({
      where: {
        userId: user.id,
        name: {
          contains: search
        }
      },
      skip: page * limit,
      take: limitMaxItemsPerPage(limit),
      orderBy: {
        [sort]: order
      },
      select: this.apiKeySelect
    })
  }

  /**
   * Checks if an API key with the given name already exists for the given user.
   *
   * @throws `ConflictException` if the API key already exists.
   * @param user The user to check for.
   * @param apiKeyName The name of the API key to check.
   */
  private async isApiKeyUnique(user: User, apiKeyName: string) {
    let apiKey: ApiKey | null = null

    try {
      apiKey = await this.prisma.apiKey.findUnique({
        where: {
          userId_name: {
            userId: user.id,
            name: apiKeyName
          }
        }
      })
    } catch (_error) {}

    if (apiKey) {
      throw new ConflictException(
        `API key with name ${apiKeyName} already exists`
      )
    }
  }
}
