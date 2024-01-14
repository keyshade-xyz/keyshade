import { ApiKey, ApiKeyProjectRole, User } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { IApiKeyRepository } from './interface.repository'
import { ApiKeyWithProjectScopes } from '../api-key.types'

export class ApiKeyRepository implements IApiKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createApiKey(user: User, apiKey: Partial<ApiKey>) {
    return this.prisma.apiKey.create({
      data: {
        name: apiKey.name,
        value: apiKey.value,
        expiresAt: apiKey.expiresAt,
        generalRoles: apiKey.generalRoles,
        user: {
          connect: {
            id: user.id
          }
        }
      }
    })
  }

  async updateApiKey(apiKeyId: ApiKey['id'], apiKey: ApiKeyWithProjectScopes) {
    return this.prisma.apiKey.update({
      where: {
        id: apiKeyId
      },
      data: {
        name: apiKey.name,
        expiresAt: apiKey.expiresAt,
        generalRoles: apiKey.generalRoles,
        projectScopes: {
          deleteMany: {
            projectId: {
              in: apiKey.projectScopes.map((scope) => scope.projectId)
            }
          },
          createMany: {
            data: apiKey.projectScopes
          }
        }
      }
    })
  }

  async updateRolesOfProjectScope(
    userId: string,
    projectId: string,
    roles: ApiKeyProjectRole[]
  ): Promise<void> {
    if (roles.length === 0) {
      await this.prisma.projectScope.deleteMany({
        where: {
          projectId,
          apiKey: {
            userId
          }
        }
      })
    } else {
      await this.prisma.projectScope.updateMany({
        where: {
          projectId,
          apiKey: {
            userId
          }
        },
        data: {
          roles
        }
      })
    }
  }

  async deleteApiKey(apiKeyId: ApiKey['id']) {
    await this.prisma.apiKey.delete({
      where: {
        id: apiKeyId
      }
    })
  }

  async findApiKeyByValue(apiKeyValue: ApiKey['value']) {
    return this.prisma.apiKey.findUnique({
      where: {
        value: apiKeyValue
      },
      include: {
        user: true
      }
    })
  }

  async findApiKeyByIdAndUserId(apiKeyId: ApiKey['id'], userId: User['id']) {
    return this.prisma.apiKey.findUnique({
      where: {
        id: apiKeyId,
        userId
      },
      include: {
        projectScopes: true
      }
    })
  }

  async findAllApiKeysByUserId(userId: User['id']) {
    return this.prisma.apiKey.findMany({
      where: {
        userId
      }
    })
  }
}
