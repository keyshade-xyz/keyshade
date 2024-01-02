import { Environment } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { IEnvironmentRepository } from './interface.repository'
import { Injectable } from '@nestjs/common'

@Injectable()
export class EnvironmentRepository implements IEnvironmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createEnvironment(
    environment: Partial<Environment>,
    projectId: string,
    userId: string
  ): Promise<Environment> {
    return await this.prisma.environment.create({
      data: {
        name: environment.name,
        description: environment.description,
        projectId,
        lastUpdatedById: userId
      }
    })
  }

  async environmentExists(
    environmentName: string,
    projectId: string
  ): Promise<boolean> {
    return await this.prisma.environment
      .count({
        where: {
          name: environmentName,
          projectId
        }
      })
      .then((count) => count > 0)
  }

  async getEnvironmentByProjectIdAndId(
    projectId: string,
    environmentId: string
  ): Promise<Environment | null> {
    return await this.prisma.environment.findUnique({
      where: {
        id: environmentId
      },
      include: {
        secrets: true,
        lastUpdatedBy: true
      }
    })
  }

  async getEnvironmentsOfProject(
    projectId: string,
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Environment[]> {
    return await this.prisma.environment.findMany({
      where: {
        projectId,
        name: {
          contains: search
        }
      },
      include: {
        secrets: true,
        lastUpdatedBy: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort]: order
      }
    })
  }

  async updateEnvironment(
    environmentId: string,
    environment: Partial<Environment>,
    userId: string
  ): Promise<Environment> {
    return await this.prisma.environment.update({
      where: {
        id: environmentId
      },
      data: {
        name: environment.name,
        description: environment.description,
        lastUpdatedById: userId
      },
      include: {
        secrets: true,
        lastUpdatedBy: true
      }
    })
  }

  async deleteEnvironment(environmentId: string): Promise<void> {
    await this.prisma.environment.delete({
      where: {
        id: environmentId
      }
    })
  }
}
