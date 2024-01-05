/* eslint-disable @typescript-eslint/no-unused-vars */
import { Environment } from '@prisma/client'
import { IEnvironmentRepository } from './interface.repository'

export class MockEnvironmentRepository implements IEnvironmentRepository {
  countTotalEnvironmentsInProject(projectId: string): Promise<number> {
    throw new Error('Method not implemented.')
  }
  getEnvironments(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<
    {
      id: string
      name: string
      description: string
      createdAt: Date
      updatedAt: Date
      isDefault: boolean
      lastUpdatedById: string
      projectId: string
    }[]
  > {
    throw new Error('Method not implemented.')
  }
  makeAllNonDefault(projectId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
  createEnvironment(
    environment: Partial<Environment>,
    projectId: string,
    userId: string
  ): Promise<Environment> {
    throw new Error('Method not implemented.')
  }
  environmentExists(
    environmentName: string,
    projectId: string
  ): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  getEnvironmentByProjectIdAndId(
    projectId: string,
    environmentId: string
  ): Promise<Environment> {
    throw new Error('Method not implemented.')
  }
  getEnvironmentsOfProject(
    projectId: string,
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Environment[]> {
    throw new Error('Method not implemented.')
  }
  updateEnvironment(
    environmentId: string,
    environment: Partial<Environment>,
    userId: string
  ): Promise<Environment> {
    throw new Error('Method not implemented.')
  }
  deleteEnvironment(environmentId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
