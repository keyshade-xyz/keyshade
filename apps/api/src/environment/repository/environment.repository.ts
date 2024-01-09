import { Environment, Project } from '@prisma/client'
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
        isDefault: environment.isDefault,
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

  async getDefaultEnvironmentOfProject(
    projectId: string
  ): Promise<{
    id: string
    name: string
    description: string
    createdAt: Date
    updatedAt: Date
    isDefault: boolean
    lastUpdatedById: string
    projectId: string
  }> {
    return await this.prisma.environment.findFirst({
      where: {
        projectId,
        isDefault: true
      }
    })
  }

  async getEnvironmentByProjectIdAndId(
    projectId: string,
    environmentId: string
  ): Promise<Environment | null> {
    return await this.prisma.environment.findUnique({
      where: {
        id: environmentId,
        projectId
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
        lastUpdatedBy: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort]: order
      }
    })
  }

  async getEnvironments(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Environment[]> {
    return await this.prisma.environment.findMany({
      where: {
        name: {
          contains: search
        }
      },
      include: {
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
        isDefault: environment.isDefault,
        lastUpdatedById: userId
      },
      include: {
        secrets: true,
        lastUpdatedBy: true
      }
    })
  }

  async makeAllNonDefault(projectId: Project['id']): Promise<void> {
    await this.prisma.environment.updateMany({
      where: {
        projectId
      },
      data: {
        isDefault: false
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

  async countTotalEnvironmentsInProject(
    projectId: Project['id']
  ): Promise<number> {
    return await this.prisma.environment.count({
      where: {
        projectId
      }
    })
  }
}
