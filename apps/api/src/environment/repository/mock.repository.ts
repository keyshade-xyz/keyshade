/* eslint-disable @typescript-eslint/no-unused-vars */
import { Environment } from '@prisma/client'
import { IEnvironmentRepository } from './interface.repository'

export class MockEnvironmentRepository implements IEnvironmentRepository {
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
