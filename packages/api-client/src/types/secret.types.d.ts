import { Page } from '../../../../apps/cli/src/types/index.types'

export interface CreateSecretRequest {
  projectId: string
  name: string
  note?: string
  rotateAfter?: '24' | '168' | '720' | '8760' | 'never'
  entries?: [
    {
      value: string
      environmentId: string
    }
  ]
}

export interface CreateSecretResponse {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  rotateAt: string | null
  note: string | null
  lastUpdatedById: string
  projectId: string
  project: {
    workspaceId: string
  }
  versions: [
    {
      value: string
      environmentId: string
    }
  ]
}

export interface UpdateSecretRequest {
  secretId: string
  name?: string
  note?: string
  rotateAfter?: '24' | '168' | '720' | '8760' | 'never'
  entries?: [
    {
      value: string
      environmentId: string
    }
  ]
}

export interface UpdateSecretResponse {
  secret: {
    id: string
    name: string
    note: string
  }
  updatedVersions: [
    {
      id?: string
      environmentId: string
      value: string
    }
  ]
}

export interface DeleteSecretRequest {
  secretId: string
}

export interface DeleteSecretResponse {}

export interface RollBackSecretRequest {
  environmentId: string
  version: number
  secretId: string
}
export interface RollBackSecretResponse {
  count: string
}

export interface GetAllSecretsOfProjectRequest {
  projectId: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}
export interface GetAllSecretsOfProjectResponse
  extends Page<{
    secret: {
      id: string
      name: string
      createdAt: string
      updatedAt: string
      rotateAt: string
      note: string | null
      lastUpdatedById: string
      projectId: string
      lastUpdatedBy: {
        id: string
        name: string
      }
    }
    values: {
      environment: {
        id: string
        name: string
      }
      value: string
      version: number
    }
  }> {}

export interface GetAllSecretsOfEnvironmentRequest {
  projectId: string
  environmentId: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}
export interface GetAllSecretsOfEnvironmentResponse
  extends Page<{
    name: string
    value: string
    isPlaintext: boolean
  }> {}
