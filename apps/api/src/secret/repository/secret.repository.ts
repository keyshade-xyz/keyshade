import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ISecretRepository } from './interface.repository'
import {
  Environment,
  Project,
  Secret,
  SecretVersion,
  User
} from '@prisma/client'
import { SecretWithValue } from '../secret.types'

@Injectable()
export class SecretRepository implements ISecretRepository {
  constructor(private readonly prisma: PrismaService) {}

  async secretExists(
    secretName: Secret['name'],
    environmentId: Environment['id'],
    projectId: Project['id'],
    userId: User['id']
  ): Promise<boolean> {
    return (
      (await this.prisma.secret.count({
        where: {
          name: secretName,
          environment: {
            id: environmentId
          },
          projectId,
          project: {
            members: {
              some: {
                userId
              }
            }
          }
        }
      })) > 0
    )
  }

  async createSecret(
    secret: Partial<SecretWithValue>, // Value comes in hashed
    projectId: Project['id'],
    environmentId: Environment['id'],
    userId: User['id']
  ): Promise<Secret> {
    return await this.prisma.secret.create({
      data: {
        name: secret.name,
        rotateAt: secret.rotateAt,
        versions: {
          create: {
            value: secret.value,
            version: 1,
            createdById: userId
          }
        },
        environmentId,
        projectId,
        lastUpdatedById: userId
      }
    })
  }

  async updateSecret(
    secretId: Secret['id'],
    secret: Partial<SecretWithValue>, // Value comes in hashed
    userId: User['id']
  ): Promise<Secret> {
    if (secret.value) {
      const previousVersion = await this.prisma.secretVersion.findFirst({
        where: {
          secretId
        },
        select: {
          version: true
        },
        orderBy: {
          version: 'desc'
        },
        take: 1
      })

      return await this.prisma.secret.update({
        where: {
          id: secretId
        },
        data: {
          name: secret.name,
          rotateAt: secret.rotateAt,
          lastUpdatedById: userId,
          versions: {
            create: {
              value: secret.value,
              version: previousVersion.version + 1,
              createdById: userId
            }
          }
        }
      })
    }

    return await this.prisma.secret.update({
      where: {
        id: secretId
      },
      data: {
        name: secret.name,
        rotateAt: secret.rotateAt,
        lastUpdatedById: userId
      }
    })
  }

  async updateVersions(
    secretId: Secret['id'],
    versions: Partial<SecretVersion>[] // Value comes in hashed
  ): Promise<void> {
    await this.prisma.secret.update({
      where: {
        id: secretId
      },
      data: {
        versions: {
          updateMany: {
            where: {
              id: {
                in: versions.map((version) => version.id)
              }
            },
            data: versions.map((version) => ({
              value: version.value
            }))
          }
        }
      }
    })
  }

  async updateSecretEnvironment(
    secretId: Secret['id'],
    environmentId: Environment['id']
  ): Promise<Secret> {
    return await this.prisma.secret.update({
      where: {
        id: secretId
      },
      data: {
        environmentId
      }
    })
  }

  async rollbackSecret(
    secretId: Secret['id'],
    rollbackVersion: SecretVersion['version']
  ): Promise<void> {
    await this.prisma.secretVersion.deleteMany({
      where: {
        secretId,
        version: {
          gt: rollbackVersion
        }
      }
    })
  }

  async deleteSecret(secretId: Secret['id']): Promise<void> {
    await this.prisma.secret.delete({
      where: {
        id: secretId
      }
    })
    return Promise.resolve()
  }

  async getSecret(
    secretId: Secret['id'],
    projectId: Project['id']
  ): Promise<Secret> {
    return await this.prisma.secret.findUnique({
      where: {
        id: secretId,
        projectId
      },
      include: {
        versions: {
          orderBy: {
            version: 'desc'
          },
          take: 1
        },
        lastUpdatedBy: true,
        environment: true
      }
    })
  }

  async getAllVersionsOfSecret(secretId: string): Promise<SecretVersion[]> {
    return await this.prisma.secretVersion.findMany({
      where: {
        secretId
      }
    })
  }

  async getAllSecretsOfProject(
    projectId: Project['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Secret[]> {
    return await this.prisma.secret.findMany({
      where: {
        projectId,
        name: {
          contains: search
        }
      },
      include: {
        versions: {
          orderBy: {
            version: 'desc'
          },
          take: 1
        },
        lastUpdatedBy: true,
        environment: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort]: order
      }
    })
  }

  async getAllSecrets(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Secret[]> {
    return await this.prisma.secret.findMany({
      where: {
        name: {
          contains: search
        }
      },
      include: {
        versions: {
          orderBy: {
            version: 'desc'
          },
          take: 1
        },
        lastUpdatedBy: true,
        environment: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort]: order
      }
    })
  }
}
