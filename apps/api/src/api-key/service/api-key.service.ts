import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { ApiKeyWorkspaceRole, User, WorkspaceRole } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateApiKey } from '../dto/create.api-key/create.api-key'
import { addHoursToDate } from '../../common/add-hours-to-date'
import { generateApiKey } from '../../common/api-key-generator'
import { toSHA256 } from '../../common/to-sha256'
import { UpdateApiKey } from '../dto/update.api-key/update.api-key'
import { ApiKeyWorkspaceRoles } from '../../common/api-key-roles'

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name)

  constructor(private readonly prisma: PrismaService) {}

  async getPermissableScopesOfWorkspaces(user: User) {
    const workspaces = await this.prisma.workspaceMember.findMany({
      where: {
        userId: user.id
      },
      select: {
        workspace: true,
        role: true
      }
    })

    function getWorkspaceScopes(role: WorkspaceRole) {
      switch (role) {
        case WorkspaceRole.VIEWER:
          return [...ApiKeyWorkspaceRoles.VIEWER]
        case WorkspaceRole.MAINTAINER:
          return [
            ...ApiKeyWorkspaceRoles.VIEWER,
            ...ApiKeyWorkspaceRoles.MAINTAINER
          ]
        case WorkspaceRole.OWNER:
          return [
            ...ApiKeyWorkspaceRoles.VIEWER,
            ...ApiKeyWorkspaceRoles.MAINTAINER,
            ...ApiKeyWorkspaceRoles.OWNER
          ]
        default:
          throw new Error(`Unknown user role ${role}`)
      }
    }

    return workspaces.map((workspace) => ({
      workspaceId: workspace.workspace.id,
      roles: getWorkspaceScopes(workspace.role)
    }))
  }

  async createApiKey(user: User, dto: CreateApiKey) {
    // For each workspace scope, check if the user has the required roles to perform the action.
    if (dto.scopes) {
      await this.checkPermissionsOfWorkspaceScopes(user, dto.scopes)
    }

    const plainTextApiKey = generateApiKey()
    const hashedApiKey = toSHA256(plainTextApiKey)
    const apiKey = dto.scopes
      ? await this.prisma.apiKey.create({
          data: {
            name: dto.name,
            value: hashedApiKey,
            expiresAt: addHoursToDate(dto.expiresAfter),
            generalRoles: dto.generalRoles,
            workspaceScopes: {
              createMany: {
                data: dto.scopes
              }
            },
            user: {
              connect: {
                id: user.id
              }
            }
          }
        })
      : await this.prisma.apiKey.create({
          data: {
            name: dto.name,
            value: hashedApiKey,
            expiresAt: addHoursToDate(dto.expiresAfter),
            generalRoles: dto.generalRoles,
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
    const apiKey = await this.prisma.apiKey.findUnique({
      where: {
        id: apiKeyId,
        userId: user.id
      },
      include: {
        workspaceScopes: true
      }
    })

    if (!apiKey) {
      throw new NotFoundException(
        `User ${user.id} is not authorized to update API key ${apiKeyId}`
      )
    }

    if (apiKey.workspaceScopes) {
      await this.checkPermissionsOfWorkspaceScopes(user, apiKey.workspaceScopes)
    }

    const updatedApiKey = apiKey.workspaceScopes
      ? await this.prisma.apiKey.update({
          where: {
            id: apiKeyId
          },
          data: {
            name: dto.name,
            expiresAt: addHoursToDate(dto.expiresAfter),
            generalRoles: dto.generalRoles,
            workspaceScopes: {
              deleteMany: {
                workspaceId: {
                  in: dto.scopes.map((scope) => scope.workspaceId)
                }
              },
              createMany: {
                data: dto.scopes
              }
            }
          }
        })
      : await this.prisma.apiKey.update({
          where: {
            id: apiKeyId
          },
          data: {
            name: dto.name,
            expiresAt: addHoursToDate(dto.expiresAfter),
            generalRoles: dto.generalRoles
          },
          select: {
            id: true,
            expiresAt: true,
            name: true,
            generalRoles: true,
            workspaceScopes: true
          }
        })

    this.logger.log(`User ${user.id} updated API key ${apiKeyId}`)

    return updatedApiKey
  }

  async deleteApiKey(user: User, apiKeyId: string) {
    return this.prisma.apiKey.delete({
      where: {
        id: apiKeyId,
        userId: user.id
      }
    })
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
        generalRoles: true,
        workspaceScopes: true
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
        name: true
      }
    })
  }

  private async checkPermissionsOfWorkspaceScopes(
    user: User,
    workspaceScopes: { workspaceId: string; roles: ApiKeyWorkspaceRole[] }[]
  ) {
    for (const apiKeyScope of workspaceScopes) {
      const membership = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: apiKeyScope.workspaceId,
            userId: user.id
          }
        }
      })

      if (!membership) {
        throw new UnauthorizedException(
          `User ${user.id} is not a member of workspace ${apiKeyScope.workspaceId}`
        )
      }

      if (
        ApiKeyWorkspaceRoles.OWNER.some(
          (role) => !membership.role.includes(role)
        )
      ) {
        if (membership.role !== WorkspaceRole.OWNER) {
          throw new UnauthorizedException(
            `User ${user.id} is not an owner of workspace ${apiKeyScope.workspaceId}`
          )
        }
      }

      if (
        ApiKeyWorkspaceRoles.MAINTAINER.some(
          (role) => !membership.role.includes(role)
        )
      ) {
        if (membership.role !== WorkspaceRole.MAINTAINER) {
          throw new UnauthorizedException(
            `User ${user.id} is not a maintainer of workspace ${apiKeyScope.workspaceId}`
          )
        }
      }
    }
  }
}
