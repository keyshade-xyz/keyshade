import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateApiKey } from '../dto/create.api-key/create.api-key'
import { addHoursToDate } from '../../common/add-hours-to-date'
import { generateApiKey } from '../../common/api-key-generator'
import { toSHA256 } from '../../common/to-sha256'
import { UpdateApiKey } from '../dto/update.api-key/update.api-key'
import { ApiKey, EventSource, EventType, User } from '@prisma/client'
import createEvent from '../../common/create-event'

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name)

  constructor(private readonly prisma: PrismaService) {}

  async createApiKey(user: User, dto: CreateApiKey) {
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

    createEvent(
      {
        triggeredBy: user,
        entity: apiKey as ApiKey,
        type: EventType.API_KEY_ADDED,
        source: EventSource.API_KEY,
        title: `API key created`,
        metadata: {
          apiKeyId: apiKey.id,
          name: apiKey.name
        }
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} created API key ${apiKey.id}`)

    return {
      ...apiKey,
      value: plainTextApiKey
    }
  }

  async updateApiKey(user: User, apiKeyId: string, dto: UpdateApiKey) {
    const updatedApiKey = await this.prisma.apiKey.update({
      where: {
        id: apiKeyId,
        userId: user.id
      },
      data: {
        name: dto.name,
        authorities: dto.authorities
          ? {
              set: dto.authorities
            }
          : undefined,
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

    createEvent(
      {
        triggeredBy: user,
        entity: updatedApiKey as ApiKey,
        type: EventType.API_KEY_UPDATED,
        source: EventSource.API_KEY,
        title: `API key updated`,
        metadata: {
          apiKeyId: updatedApiKey.id,
          name: updatedApiKey.name
        }
      },
      this.prisma
    )

    this.logger.log(`User ${user.id} updated API key ${apiKeyId}`)

    return updatedApiKey
  }

  async deleteApiKey(user: User, apiKeyId: string) {
    const apiKey = await this.prisma.apiKey.delete({
      where: {
        id: apiKeyId,
        userId: user.id
      }
    })

    createEvent(
      {
        triggeredBy: user,
        type: EventType.API_KEY_DELETED,
        source: EventSource.API_KEY,
        title: `API key deleted`,
        metadata: {
          name: apiKey.name
        }
      },
      this.prisma
    )
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
      throw new NotFoundException(
        `User ${user.id} is not authorized to access API key ${apiKeyId}`
      )
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
      skip: (page - 1) * limit,
      take: limit,
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
}
