/* eslint-disable @typescript-eslint/no-unused-vars */
import { ISecretRepository } from './interface.repository'

export class MockSecretRepository implements ISecretRepository {
  secretExists(
    secretName: string,
    environmentId: string,
    projectId: string,
    userId: string
  ): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  createSecret(
    secret: Partial<{
      id: string
      name: string
      createdAt: Date
      updatedAt: Date
      rotateAt: Date
      lastUpdatedById: string
      projectId: string
      environmentId: string
    }>,
    projectId: string,
    environmentId: string,
    userId: string
  ): Promise<{
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    rotateAt: Date
    lastUpdatedById: string
    projectId: string
    environmentId: string
  }> {
    throw new Error('Method not implemented.')
  }
  updateSecret(
    secretId: string,
    secret: Partial<{
      id: string
      name: string
      createdAt: Date
      updatedAt: Date
      rotateAt: Date
      lastUpdatedById: string
      projectId: string
      environmentId: string
    }>,
    userId: string
  ): Promise<{
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    rotateAt: Date
    lastUpdatedById: string
    projectId: string
    environmentId: string
  }> {
    throw new Error('Method not implemented.')
  }
  updateVersions(
    secretId: string,
    versions: Partial<{
      id: string
      value: string
      version: number
      secretId: string
      createdOn: Date
      createdById: string
    }>[]
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
  updateSecretEnvironment(
    secretId: string,
    environmentId: string,
    userId: string
  ): Promise<{
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    rotateAt: Date
    lastUpdatedById: string
    projectId: string
    environmentId: string
  }> {
    throw new Error('Method not implemented.')
  }
  rollbackSecret(secretId: string, rollbackVersion: number): Promise<void> {
    throw new Error('Method not implemented.')
  }
  deleteSecret(secretId: string, userId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getSecret(
    secretId: string,
    projectId: string
  ): Promise<{
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    rotateAt: Date
    lastUpdatedById: string
    projectId: string
    environmentId: string
  }> {
    throw new Error('Method not implemented.')
  }
  getAllVersionsOfSecret(secretId: string): Promise<
    {
      id: string
      value: string
      version: number
      secretId: string
      createdOn: Date
      createdById: string
    }[]
  > {
    throw new Error('Method not implemented.')
  }
  getAllSecretsOfProject(
    projectId: string,
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<
    {
      id: string
      name: string
      createdAt: Date
      updatedAt: Date
      rotateAt: Date
      lastUpdatedById: string
      projectId: string
      environmentId: string
    }[]
  > {
    throw new Error('Method not implemented.')
  }
  getAllSecrets(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<
    {
      id: string
      name: string
      createdAt: Date
      updatedAt: Date
      rotateAt: Date
      lastUpdatedById: string
      projectId: string
      environmentId: string
    }[]
  > {
    throw new Error('Method not implemented.')
  }
}
