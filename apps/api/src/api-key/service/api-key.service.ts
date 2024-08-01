import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateApiKey } from '../dto/create.api-key/create.api-key'
import { addHoursToDate } from '../../common/add-hours-to-date'
import { generateApiKey } from '../../common/api-key-generator'
import { toSHA256 } from '../../common/to-sha256'
import { UpdateApiKey } from '../dto/update.api-key/update.api-key'
import { ApiKey, User } from '@prisma/client'
import { limitMaxItemsPerPage } from '../../common/limit-max-items-per-page'

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name)

  constructor(private readonly prisma: PrismaService) {}

  async createApiKey(user: User, dto: CreateApiKey) {
    await this.isApiKeyUnique(user, dto.name)

    const plainTextApiKey = generateApiKey()
    const hashedApiKey = toSHA256(plainTextApiKey)
    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: dto.name,
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

  async updateApiKey(user: User, apiKeyId: string, dto: UpdateApiKey) {
    await this.isApiKeyUnique(user, dto.name)

    const apiKey = await this.prisma.apiKey.findUnique({
      where: {
        id: apiKeyId,
        userId: user.id
      }
    })

    if (!apiKey) {
      throw new NotFoundException(`API key with id ${apiKeyId} not found`)
    }

    const updatedApiKey = await this.prisma.apiKey.update({
      where: {
        id: apiKeyId,
        userId: user.id
      },
      data: {
        name: dto.name,
        authorities: {
          set: dto.authorities ? dto.authorities : apiKey.authorities
        },
        expiresAt: dto.expiresAfter
          ? addHoursToDate(dto.expiresAfter)
          : undefined
      },
      select: {
        id: true,
        expiresAt: true,
        name: true,
        authorities: true,
        createdAt: true,
        updatedAt: true
      }
    })

    this.logger.log(`User ${user.id} updated API key ${apiKeyId}`)

    return updatedApiKey
  }

  async deleteApiKey(user: User, apiKeyId: string) {
    try {
      await this.prisma.apiKey.delete({
        where: {
          id: apiKeyId,
          userId: user.id
        }
      })
    } catch (error) {
      throw new NotFoundException(`API key with id ${apiKeyId} not found`)
    }

    this.logger.log(`User ${user.id} deleted API key ${apiKeyId}`)
  }

  async getApiKeyById(user: User, apiKeyId: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: {
        id: apiKeyId,
        userId: user.id
      },
      select: {
        id: true,
        expiresAt: true,
        name: true,
        authorities: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!apiKey) {
      throw new NotFoundException(`API key with id ${apiKeyId} not found`)
    }

    return apiKey
  }

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
      select: {
        id: true,
        expiresAt: true,
        name: true,
        authorities: true,
        createdAt: true,
        updatedAt: true
      }
    })
  }

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
