import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { ApiKeyProjectRole, ProjectRole, User } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { ApiKeyProjectRoles } from '../../common/api-key-roles'
import { CreateApiKey } from '../dto/create.api-key/create.api-key'
import { addHoursToDate } from '../../common/add-hours-to-date'
import { generateApiKey } from '../../common/api-key-generator'
import { toSHA256 } from '../../common/to-sha256'
import { UpdateApiKey } from '../dto/update.api-key/update.api-key'

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name)

  constructor(private readonly prisma: PrismaService) {}

  async getPermissableScopesOfProjects(user: User) {
    const projects = await this.prisma.projectMember.findMany({
      where: {
        userId: user.id
      },
      select: {
        project: true,
        role: true
      }
    })

    function getProjectScopes(role: ProjectRole) {
      switch (role) {
        case ProjectRole.VIEWER:
          return [...ApiKeyProjectRoles.VIEWER]
        case ProjectRole.MAINTAINER:
          return [
            ...ApiKeyProjectRoles.VIEWER,
            ...ApiKeyProjectRoles.MAINTAINER
          ]
        case ProjectRole.OWNER:
          return [
            ...ApiKeyProjectRoles.VIEWER,
            ...ApiKeyProjectRoles.MAINTAINER,
            ...ApiKeyProjectRoles.OWNER
          ]
        default:
          throw new Error(`Unknown user role ${role}`)
      }
    }

    return projects.map((project) => ({
      projectId: project.project.id,
      roles: getProjectScopes(project.role)
    }))
  }

  async createApiKey(user: User, dto: CreateApiKey) {
    // For each project scope, check if the user has the required roles to perform the action.
    if (dto.scopes) {
      await this.checkPermissionsOfProjectScopes(user, dto.scopes)
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
            projectScopes: {
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
        projectScopes: true
      }
    })

    if (!apiKey) {
      throw new NotFoundException(
        `User ${user.id} is not authorized to update API key ${apiKeyId}`
      )
    }

    if (apiKey.projectScopes) {
      await this.checkPermissionsOfProjectScopes(user, apiKey.projectScopes)
    }

    const updatedApiKey = apiKey.projectScopes
      ? await this.prisma.apiKey.update({
          where: {
            id: apiKeyId
          },
          data: {
            name: dto.name,
            expiresAt: addHoursToDate(dto.expiresAfter),
            generalRoles: dto.generalRoles,
            projectScopes: {
              deleteMany: {
                projectId: {
                  in: dto.scopes.map((scope) => scope.projectId)
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
            projectScopes: true
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
        projectScopes: true
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

  private async checkPermissionsOfProjectScopes(
    user: User,
    projectScopes: { projectId: string; roles: ApiKeyProjectRole[] }[]
  ) {
    for (const apiKeyScope of projectScopes) {
      const membership = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: apiKeyScope.projectId,
            userId: user.id
          }
        }
      })

      if (!membership) {
        throw new UnauthorizedException(
          `User ${user.id} is not a member of project ${apiKeyScope.projectId}`
        )
      }

      if (
        ApiKeyProjectRoles.OWNER.some((role) => !membership.role.includes(role))
      ) {
        if (membership.role !== ProjectRole.OWNER) {
          throw new UnauthorizedException(
            `User ${user.id} is not an owner of project ${apiKeyScope.projectId}`
          )
        }
      }

      if (
        ApiKeyProjectRoles.MAINTAINER.some(
          (role) => !membership.role.includes(role)
        )
      ) {
        if (membership.role !== ProjectRole.MAINTAINER) {
          throw new UnauthorizedException(
            `User ${user.id} is not a maintainer of project ${apiKeyScope.projectId}`
          )
        }
      }
    }
  }
}
